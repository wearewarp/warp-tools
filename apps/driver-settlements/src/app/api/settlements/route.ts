import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  settlements,
  drivers,
  trips,
  settlementDeductions,
  advances,
  deductionTemplates,
} from '@/db/schema';
import { eq, and, gte, lte, isNull, like, desc, asc, or, count } from 'drizzle-orm';
import { calculateTripPay } from '@/lib/pay-calculator';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ─── GET /api/settlements ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const driverId = searchParams.get('driver_id') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const sortBy = searchParams.get('sort_by') ?? 'id';
  const sortDir = searchParams.get('sort_dir') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, parseInt(searchParams.get('page_size') ?? '25', 10));
  const offset = (page - 1) * pageSize;

  try {
    const allDrivers = await db.select().from(drivers);
    const driverMap = new Map(allDrivers.map((d) => [d.id, d]));

    // Build filters
    const filters = [];
    if (status) filters.push(eq(settlements.status, status as 'open' | 'submitted' | 'approved' | 'paid' | 'disputed'));
    if (driverId) filters.push(eq(settlements.driver_id, parseInt(driverId, 10)));
    if (dateFrom) filters.push(gte(settlements.period_start, dateFrom));
    if (dateTo) filters.push(lte(settlements.period_end, dateTo));

    const orderCol =
      sortBy === 'net_pay' ? settlements.net_pay :
      sortBy === 'gross_earnings' ? settlements.gross_earnings :
      sortBy === 'period_start' ? settlements.period_start :
      sortBy === 'period_end' ? settlements.period_end :
      sortBy === 'settlement_number' ? settlements.settlement_number :
      settlements.id;
    const orderFn = sortDir === 'asc' ? asc : desc;

    let query = db
      .select({
        id: settlements.id,
        settlement_number: settlements.settlement_number,
        driver_id: settlements.driver_id,
        period_start: settlements.period_start,
        period_end: settlements.period_end,
        status: settlements.status,
        gross_earnings: settlements.gross_earnings,
        total_deductions: settlements.total_deductions,
        total_reimbursements: settlements.total_reimbursements,
        total_advances: settlements.total_advances,
        net_pay: settlements.net_pay,
        paid_date: settlements.paid_date,
        payment_method: settlements.payment_method,
        payment_reference: settlements.payment_reference,
        approved_by: settlements.approved_by,
        approved_at: settlements.approved_at,
        disputed_reason: settlements.disputed_reason,
        notes: settlements.notes,
        created_at: settlements.created_at,
        updated_at: settlements.updated_at,
      })
      .from(settlements)
      .$dynamic();

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    query = query.orderBy(orderFn(orderCol));

    let rows = await query;

    // Post-filter by search (driver name or settlement number)
    if (search) {
      const lower = search.toLowerCase();
      rows = rows.filter((s) => {
        const driver = driverMap.get(s.driver_id);
        const driverName = driver ? `${driver.first_name} ${driver.last_name}`.toLowerCase() : '';
        return (
          s.settlement_number.toLowerCase().includes(lower) ||
          driverName.includes(lower)
        );
      });
    }

    const total = rows.length;
    const paginated = rows.slice(offset, offset + pageSize);

    const result = paginated.map((s) => {
      const driver = driverMap.get(s.driver_id);
      return {
        ...s,
        driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown',
        driver_pay_type: driver?.pay_type,
      };
    });

    return NextResponse.json({
      settlements: result,
      total,
      page,
      page_size: pageSize,
      pages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error('GET /api/settlements error:', err);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

// ─── POST /api/settlements ─────────────────────────────────────────────────────

const CreateSettlementSchema = z.object({
  driver_id: z.number().int().positive(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSettlementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { driver_id, period_start, period_end, notes } = parsed.data;

    // Validate driver exists
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, driver_id));
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Generate settlement number
    const [lastSettlement] = await db
      .select({ id: settlements.id })
      .from(settlements)
      .orderBy(desc(settlements.id))
      .limit(1);
    const nextNum = (lastSettlement?.id ?? 0) + 1;
    const year = new Date().getFullYear();
    const settlementNumber = `SET-${year}-${String(nextNum).padStart(4, '0')}`;

    // Auto-populate trips in period for this driver that aren't yet assigned
    const periodTrips = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.driver_id, driver_id),
          isNull(trips.settlement_id),
          gte(trips.trip_date, period_start),
          lte(trips.trip_date, period_end)
        )
      );

    // Recalculate pay for trips based on current driver rate
    const updatedTrips = periodTrips.map((t) => ({
      ...t,
      pay_amount: calculateTripPay(driver.pay_type, driver.pay_rate, {
        miles: t.miles,
        revenue: t.revenue,
        hours: t.hours,
        stops: t.stops,
      }),
    }));

    const gross = Math.round(updatedTrips.reduce((s, t) => s + t.pay_amount, 0) * 100) / 100;

    // Get active recurring deduction templates
    const templates = await db
      .select()
      .from(deductionTemplates)
      .where(eq(deductionTemplates.active, true));

    // Outstanding advances for this driver
    const outstandingAdvances = await db
      .select()
      .from(advances)
      .where(and(eq(advances.driver_id, driver_id), eq(advances.status, 'outstanding')));

    const totalDeductions = Math.round(
      templates.reduce((s, t) => {
        const amt = t.is_percentage ? (gross * t.amount) / 100 : t.amount;
        return s + amt;
      }, 0) * 100
    ) / 100;

    const totalAdvances = Math.round(
      outstandingAdvances.reduce((s, a) => s + a.amount, 0) * 100
    ) / 100;

    const netPay = Math.round((gross - totalDeductions - totalAdvances) * 100) / 100;

    // Create settlement
    const [newSettlement] = await db
      .insert(settlements)
      .values({
        settlement_number: settlementNumber,
        driver_id,
        period_start,
        period_end,
        status: 'open',
        gross_earnings: gross,
        total_deductions: totalDeductions,
        total_reimbursements: 0,
        total_advances: totalAdvances,
        net_pay: netPay,
        notes: notes ?? null,
      })
      .returning();

    // Assign trips to settlement + update pay
    for (const trip of updatedTrips) {
      await db
        .update(trips)
        .set({ settlement_id: newSettlement.id, pay_amount: trip.pay_amount })
        .where(eq(trips.id, trip.id));
    }

    // Insert deductions from templates
    if (templates.length > 0) {
      await db.insert(settlementDeductions).values(
        templates.map((t) => ({
          settlement_id: newSettlement.id,
          description: t.name,
          amount: t.is_percentage ? Math.round((gross * t.amount) / 100 * 100) / 100 : t.amount,
          deduction_type: 'recurring' as const,
          category: t.category,
        }))
      );
    }

    // Link outstanding advances to settlement
    if (outstandingAdvances.length > 0) {
      for (const adv of outstandingAdvances) {
        await db
          .update(advances)
          .set({ settlement_id: newSettlement.id })
          .where(eq(advances.id, adv.id));
      }
    }

    return NextResponse.json({ settlement: newSettlement }, { status: 201 });
  } catch (err) {
    console.error('POST /api/settlements error:', err);
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
  }
}
