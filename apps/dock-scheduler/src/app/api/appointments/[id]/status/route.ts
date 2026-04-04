import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apptId = parseInt(id, 10);
    const body = await req.json();
    const { action, cancellation_reason } = body;

    const [appt] = await db.select().from(appointments).where(eq(appointments.id, apptId));
    if (!appt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'check_in': {
        if (appt.status !== 'scheduled') {
          return NextResponse.json({ error: `Cannot check in from status: ${appt.status}` }, { status: 400 });
        }
        updateData.status = 'checked_in';
        updateData.checked_in_at = now;
        // wait_minutes = now - scheduled_time (as datetime on scheduled_date)
        const scheduledDt = `${appt.scheduled_date}T${appt.scheduled_time}:00`;
        updateData.wait_minutes = minutesBetween(scheduledDt, now);
        break;
      }
      case 'start': {
        if (appt.status !== 'checked_in') {
          return NextResponse.json({ error: `Cannot start from status: ${appt.status}` }, { status: 400 });
        }
        updateData.status = 'in_progress';
        updateData.in_progress_at = now;
        break;
      }
      case 'complete': {
        if (appt.status !== 'in_progress') {
          return NextResponse.json({ error: `Cannot complete from status: ${appt.status}` }, { status: 400 });
        }
        updateData.status = 'completed';
        updateData.completed_at = now;
        if (appt.in_progress_at) {
          updateData.dock_minutes = minutesBetween(appt.in_progress_at, now);
        }
        if (appt.checked_in_at) {
          updateData.total_dwell_minutes = minutesBetween(appt.checked_in_at, now);
        }
        break;
      }
      case 'no_show': {
        if (['completed', 'cancelled', 'no_show'].includes(appt.status)) {
          return NextResponse.json({ error: `Cannot mark no-show from status: ${appt.status}` }, { status: 400 });
        }
        updateData.status = 'no_show';
        break;
      }
      case 'cancel': {
        if (['completed', 'cancelled', 'no_show'].includes(appt.status)) {
          return NextResponse.json({ error: `Cannot cancel from status: ${appt.status}` }, { status: 400 });
        }
        if (!cancellation_reason) {
          return NextResponse.json({ error: 'cancellation_reason is required' }, { status: 400 });
        }
        updateData.status = 'cancelled';
        updateData.cancelled_at = now;
        updateData.cancellation_reason = cancellation_reason;
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

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
