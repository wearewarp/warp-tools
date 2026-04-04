import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trips, drivers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateTripPay } from '@/lib/pay-calculator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const driverId = searchParams.get('driver_id');

  const query = db.select().from(trips).orderBy(desc(trips.trip_date));

  if (driverId) {
    const all = await db.select().from(trips).where(eq(trips.driver_id, parseInt(driverId, 10))).orderBy(desc(trips.trip_date));
    return NextResponse.json(all);
  }

  const all = await query;
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      driver_id,
      load_ref,
      origin_city,
      origin_state,
      dest_city,
      dest_state,
      trip_date,
      miles,
      revenue,
      hours,
      stops,
      notes,
    } = body;

    if (!driver_id || !origin_city || !origin_state || !dest_city || !dest_state || !trip_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch driver to get pay type + rate
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, parseInt(driver_id, 10)));
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const pay_amount = calculateTripPay(driver.pay_type, driver.pay_rate, {
      miles: miles ? parseFloat(miles) : null,
      revenue: revenue ? parseFloat(revenue) : null,
      hours: hours ? parseFloat(hours) : null,
      stops: stops ? parseInt(stops, 10) : null,
    });

    const [trip] = await db
      .insert(trips)
      .values({
        driver_id: parseInt(driver_id, 10),
        load_ref,
        origin_city,
        origin_state,
        dest_city,
        dest_state,
        trip_date,
        miles: miles ? parseFloat(miles) : null,
        revenue: revenue ? parseFloat(revenue) : null,
        hours: hours ? parseFloat(hours) : null,
        stops: stops ? parseInt(stops, 10) : null,
        pay_amount,
        notes,
      })
      .returning();

    return NextResponse.json(trip, { status: 201 });
  } catch (err) {
    console.error('POST /api/trips error:', err);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
