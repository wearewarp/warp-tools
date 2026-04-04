import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers, trips, advances } from '@/db/schema';
import { desc, asc, like, or, and, eq, sql } from 'drizzle-orm';
import type { PayType, DriverStatus } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const payType = searchParams.get('pay_type') ?? '';
  const sortBy = searchParams.get('sort') ?? 'last_name';
  const sortDir = searchParams.get('dir') ?? 'asc';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(drivers.first_name, `%${search}%`),
        like(drivers.last_name, `%${search}%`),
        like(drivers.email, `%${search}%`),
      )
    );
  }

  if (status) {
    conditions.push(eq(drivers.status, status as DriverStatus));
  }

  if (payType) {
    conditions.push(eq(drivers.pay_type, payType as PayType));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = (() => {
    switch (sortBy) {
      case 'first_name': return drivers.first_name;
      case 'pay_type': return drivers.pay_type;
      case 'pay_rate': return drivers.pay_rate;
      case 'hire_date': return drivers.hire_date;
      case 'status': return drivers.status;
      default: return drivers.last_name;
    }
  })();

  const orderFn = sortDir === 'asc' ? asc : desc;

  const [allDrivers, countResult] = await Promise.all([
    db.select().from(drivers).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(drivers).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  // Get current year for YTD
  const yearStart = `${new Date().getFullYear()}-01-01`;

  // Get trip counts and YTD earnings for each driver
  const driverIds = allDrivers.map(d => d.id);
  const tripStats = driverIds.length > 0
    ? await db
        .select({
          driver_id: trips.driver_id,
          ytd_earnings: sql<number>`sum(case when ${trips.trip_date} >= ${yearStart} then ${trips.pay_amount} else 0 end)`,
          ytd_trips: sql<number>`count(case when ${trips.trip_date} >= ${yearStart} then 1 end)`,
        })
        .from(trips)
        .where(sql`${trips.driver_id} IN (${sql.join(driverIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(trips.driver_id)
    : [];

  const statsMap = new Map(tripStats.map(s => [s.driver_id, s]));

  const result = allDrivers.map(d => ({
    ...d,
    ytd_earnings: statsMap.get(d.id)?.ytd_earnings ?? 0,
    ytd_trips: statsMap.get(d.id)?.ytd_trips ?? 0,
  }));

  return NextResponse.json({
    drivers: result,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      address_street,
      address_city,
      address_state,
      address_zip,
      license_number,
      license_state,
      license_expiry,
      pay_type,
      pay_rate,
      hire_date,
      emergency_contact_name,
      emergency_contact_phone,
      notes,
    } = body;

    if (!first_name || !last_name || !pay_type || pay_rate == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [driver] = await db
      .insert(drivers)
      .values({
        first_name,
        last_name,
        email,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip,
        license_number,
        license_state,
        license_expiry,
        pay_type,
        pay_rate: parseFloat(pay_rate),
        hire_date,
        emergency_contact_name,
        emergency_contact_phone,
        notes,
        status: 'active',
      })
      .returning();

    return NextResponse.json(driver, { status: 201 });
  } catch (err) {
    console.error('POST /api/drivers error:', err);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
