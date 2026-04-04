import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Only check_in ones that are currently 'scheduled'
    const rows = await db
      .select()
      .from(appointments)
      .where(inArray(appointments.id, ids));

    const scheduledOnes = rows.filter((a) => a.status === 'scheduled');
    if (scheduledOnes.length === 0) {
      return NextResponse.json({ error: 'No scheduled appointments found in provided ids' }, { status: 400 });
    }

    const results = [];
    for (const appt of scheduledOnes) {
      const scheduledDt = `${appt.scheduled_date}T${appt.scheduled_time}:00`;
      const wait_minutes = minutesBetween(scheduledDt, now);
      const [updated] = await db
        .update(appointments)
        .set({ status: 'checked_in', checked_in_at: now, wait_minutes })
        .where(eq(appointments.id, appt.id))
        .returning();
      results.push(updated);
    }

    return NextResponse.json({ checkedIn: results, count: results.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
