import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { calculateEndTime } from '@/lib/utils';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dock_door_id = searchParams.get('dock_door_id');
    const scheduled_date = searchParams.get('scheduled_date');
    const scheduled_time = searchParams.get('scheduled_time');
    const duration_minutes = searchParams.get('duration_minutes');
    const exclude_id = searchParams.get('exclude_id');

    if (!dock_door_id || !scheduled_date || !scheduled_time || !duration_minutes) {
      return NextResponse.json({ conflicts: [] });
    }

    const endTime = calculateEndTime(scheduled_time, parseInt(duration_minutes, 10));
    const newStart = timeToMinutes(scheduled_time);
    const newEnd = timeToMinutes(endTime);

    const conditions = [
      eq(appointments.dock_door_id, parseInt(dock_door_id, 10)),
      eq(appointments.scheduled_date, scheduled_date),
      ne(appointments.status, 'cancelled'),
      ne(appointments.status, 'no_show'),
    ];
    if (exclude_id) {
      conditions.push(ne(appointments.id, parseInt(exclude_id, 10)));
    }

    const existing = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    const conflicts = existing.filter((a) => {
      if (!a.end_time) return false;
      const aStart = timeToMinutes(a.scheduled_time);
      const aEnd = timeToMinutes(a.end_time);
      return newStart < aEnd && newEnd > aStart;
    });

    return NextResponse.json({
      conflicts: conflicts.map((c) => ({
        id: c.id,
        carrier_name: c.carrier_name,
        scheduled_time: c.scheduled_time,
        end_time: c.end_time,
        status: c.status,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ conflicts: [] });
  }
}
