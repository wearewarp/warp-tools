import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trips, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateTripPay } from '@/lib/pay-calculator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip] = await db.select().from(trips).where(eq(trips.id, parseInt(id, 10)));
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  return NextResponse.json(trip);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  try {
    const body = await req.json();

    const [existing] = await db.select().from(trips).where(eq(trips.id, tripId));
    if (!existing) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // If pay-affecting fields changed, recalculate
    let pay_amount = existing.pay_amount;
    const hasPayFields = ['miles', 'revenue', 'hours', 'stops'].some(f => f in body);

    if (hasPayFields) {
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, existing.driver_id));
      if (driver) {
        pay_amount = calculateTripPay(driver.pay_type, driver.pay_rate, {
          miles: body.miles ?? existing.miles,
          revenue: body.revenue ?? existing.revenue,
          hours: body.hours ?? existing.hours,
          stops: body.stops ?? existing.stops,
        });
      }
    }

    const [updated] = await db
      .update(trips)
      .set({ ...body, pay_amount })
      .where(eq(trips.id, tripId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/trips/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  try {
    const [deleted] = await db.delete(trips).where(eq(trips.id, tripId)).returning();
    if (!deleted) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/trips/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
