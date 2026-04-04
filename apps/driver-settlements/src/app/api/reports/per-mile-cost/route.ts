import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers, trips, settlements } from '@/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';

  try {
    const perMileDrivers = await db
      .select()
      .from(drivers)
      .where(eq(drivers.pay_type, 'per_mile'));

    if (perMileDrivers.length === 0) {
      return NextResponse.json({ report: [], date_from: dateFrom, date_to: dateTo });
    }

    const tripFilters = [];
    if (dateFrom) tripFilters.push(gte(trips.trip_date, dateFrom));
    if (dateTo) tripFilters.push(lte(trips.trip_date, dateTo));

    const allTrips = tripFilters.length > 0
      ? await db.select().from(trips).where(and(...tripFilters))
      : await db.select().from(trips);

    const report = perMileDrivers.map((driver) => {
      const driverTrips = allTrips.filter((t) => t.driver_id === driver.id);
      const totalMiles = driverTrips.reduce((s, t) => s + (t.miles ?? 0), 0);
      const totalPay = driverTrips.reduce((s, t) => s + t.pay_amount, 0);
      const perMile = totalMiles > 0 ? totalPay / totalMiles : 0;

      return {
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        pay_rate: driver.pay_rate,
        trip_count: driverTrips.length,
        total_miles: Math.round(totalMiles * 10) / 10,
        total_pay: Math.round(totalPay * 100) / 100,
        cost_per_mile: Math.round(perMile * 1000) / 1000,
      };
    });

    return NextResponse.json({ report, date_from: dateFrom, date_to: dateTo });
  } catch (err) {
    console.error('GET /api/reports/per-mile-cost error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
