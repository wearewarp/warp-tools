import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlements, drivers, trips } from '@/db/schema';
import { eq, gte, lte, and, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';

  try {
    const allDrivers = await db.select().from(drivers).where(eq(drivers.status, 'active'));

    const filters = [];
    if (dateFrom) filters.push(gte(settlements.period_start, dateFrom));
    if (dateTo) filters.push(lte(settlements.period_end, dateTo));

    const settlementsData = filters.length > 0
      ? await db.select().from(settlements).where(and(...filters))
      : await db.select().from(settlements);

    const result = allDrivers.map((driver) => {
      const driverSettlements = settlementsData.filter((s) => s.driver_id === driver.id);
      const gross = driverSettlements.reduce((s, r) => s + r.gross_earnings, 0);
      const deductions = driverSettlements.reduce((s, r) => s + r.total_deductions, 0);
      const reimbursements = driverSettlements.reduce((s, r) => s + r.total_reimbursements, 0);
      const advances = driverSettlements.reduce((s, r) => s + r.total_advances, 0);
      const net = driverSettlements.reduce((s, r) => s + r.net_pay, 0);

      return {
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        pay_type: driver.pay_type,
        settlement_count: driverSettlements.length,
        gross: Math.round(gross * 100) / 100,
        deductions: Math.round(deductions * 100) / 100,
        reimbursements: Math.round(reimbursements * 100) / 100,
        advances: Math.round(advances * 100) / 100,
        net: Math.round(net * 100) / 100,
      };
    });

    return NextResponse.json({ report: result, date_from: dateFrom, date_to: dateTo });
  } catch (err) {
    console.error('GET /api/reports/pay-summary error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
