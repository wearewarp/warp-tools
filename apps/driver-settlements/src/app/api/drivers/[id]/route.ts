import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers, trips, advances } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { NewDriver } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driverId = parseInt(id, 10);

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));
  if (!driver) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
  }

  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [tripStats] = await db
    .select({
      total_trips: sql<number>`count(*)`,
      ytd_earnings: sql<number>`sum(case when ${trips.trip_date} >= ${yearStart} then ${trips.pay_amount} else 0 end)`,
      ytd_trips: sql<number>`count(case when ${trips.trip_date} >= ${yearStart} then 1 end)`,
      total_miles: sql<number>`sum(coalesce(${trips.miles}, 0))`,
    })
    .from(trips)
    .where(eq(trips.driver_id, driverId));

  const [advanceStats] = await db
    .select({
      outstanding_advances: sql<number>`sum(case when ${advances.status} = 'outstanding' then ${advances.amount} else 0 end)`,
    })
    .from(advances)
    .where(eq(advances.driver_id, driverId));

  return NextResponse.json({
    ...driver,
    stats: {
      total_trips: tripStats?.total_trips ?? 0,
      ytd_earnings: tripStats?.ytd_earnings ?? 0,
      ytd_trips: tripStats?.ytd_trips ?? 0,
      total_miles: tripStats?.total_miles ?? 0,
      outstanding_advances: advanceStats?.outstanding_advances ?? 0,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driverId = parseInt(id, 10);

  try {
    const body = await req.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone',
      'address_street', 'address_city', 'address_state', 'address_zip',
      'license_number', 'license_state', 'license_expiry',
      'pay_type', 'pay_rate', 'hire_date', 'status', 'termination_date',
      'emergency_contact_name', 'emergency_contact_phone', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Handle termination
    if (body.action === 'terminate') {
      updateData.status = 'terminated';
      updateData.termination_date = new Date().toISOString().split('T')[0];
    }

    const [updated] = await db
      .update(drivers)
      .set(updateData as Partial<NewDriver>)
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/drivers/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driverId = parseInt(id, 10);

  try {
    // Soft delete: set status to terminated
    const [updated] = await db
      .update(drivers)
      .set({
        status: 'terminated',
        termination_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/drivers/[id] error:', err);
    return NextResponse.json({ error: 'Failed to terminate driver' }, { status: 500 });
  }
}
