import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateEndTime } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, parseInt(id, 10)));
    if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ appointment: appt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apptId = parseInt(id, 10);
    const body = await req.json();

    const {
      dock_door_id,
      appointment_type,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      carrier_name,
      driver_name,
      truck_number,
      trailer_number,
      driver_phone,
      load_ref,
      po_number,
      commodity,
      special_instructions,
      notes,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (dock_door_id !== undefined) updateData.dock_door_id = Number(dock_door_id);
    if (appointment_type !== undefined) updateData.appointment_type = appointment_type;
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time;
    if (duration_minutes !== undefined) updateData.duration_minutes = Number(duration_minutes);
    if (carrier_name !== undefined) updateData.carrier_name = carrier_name;
    if (driver_name !== undefined) updateData.driver_name = driver_name;
    if (truck_number !== undefined) updateData.truck_number = truck_number;
    if (trailer_number !== undefined) updateData.trailer_number = trailer_number;
    if (driver_phone !== undefined) updateData.driver_phone = driver_phone;
    if (load_ref !== undefined) updateData.load_ref = load_ref;
    if (po_number !== undefined) updateData.po_number = po_number;
    if (commodity !== undefined) updateData.commodity = commodity;
    if (special_instructions !== undefined) updateData.special_instructions = special_instructions;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate end_time if time/duration changed
    const [current] = await db.select().from(appointments).where(eq(appointments.id, apptId));
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newScheduledTime = (scheduled_time ?? current.scheduled_time) as string;
    const newDuration = (duration_minutes ?? current.duration_minutes) as number;
    updateData.end_time = calculateEndTime(newScheduledTime, newDuration);

    const [updated] = await db
      .update(appointments)
      .set(updateData as never)
      .where(eq(appointments.id, apptId))
      .returning();

    return NextResponse.json({ appointment: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apptId = parseInt(id, 10);
    const body = await req.json().catch(() => ({}));
    const { cancellation_reason } = body;

    const [updated] = await db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason ?? 'Cancelled',
      })
      .where(eq(appointments.id, apptId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ appointment: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
