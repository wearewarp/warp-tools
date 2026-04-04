import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay(); // 0=Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const view = searchParams.get('view') ?? 'day';

  try {
    const [facility] = await db.select().from(facilities).limit(1);
    if (!facility) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 });
    }

    const doors = await db
      .select()
      .from(dockDoors)
      .where(eq(dockDoors.facility_id, facility.id))
      .orderBy(dockDoors.sort_order);

    if (view === 'week') {
      const { weekStart, weekEnd } = getWeekBounds(dateParam);

      const weekAppts = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.facility_id, facility.id),
            gte(appointments.scheduled_date, weekStart),
            lte(appointments.scheduled_date, weekEnd)
          )
        );

      // dailySummary: { [date]: { [doorId]: count } }
      const dailySummary: Record<string, Record<number, number>> = {};
      for (const appt of weekAppts) {
        if (!dailySummary[appt.scheduled_date]) {
          dailySummary[appt.scheduled_date] = {};
        }
        const cur = dailySummary[appt.scheduled_date][appt.dock_door_id] ?? 0;
        dailySummary[appt.scheduled_date][appt.dock_door_id] = cur + 1;
      }

      return NextResponse.json({ facility, doors, dailySummary, weekStart, weekEnd });
    }

    // day view
    const dayAppts = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.facility_id, facility.id),
          eq(appointments.scheduled_date, dateParam)
        )
      )
      .orderBy(appointments.scheduled_time);

    return NextResponse.json({ facility, doors, appointments: dayAppts, date: dateParam });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
