import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { and, gte, lte, ne } from 'drizzle-orm';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    const [facility] = await db.select().from(facilities).limit(1);
    const doors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

    const conditions = [
      ne(appointments.status, 'cancelled'),
      ne(appointments.status, 'no_show'),
    ];
    if (from) conditions.push(gte(appointments.scheduled_date, from));
    if (to) conditions.push(lte(appointments.scheduled_date, to));

    const rows = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    const operatingStart = facility?.operating_hours_start ?? '06:00';
    const operatingEnd = facility?.operating_hours_end ?? '18:00';
    const hoursAvailable = (timeToMinutes(operatingEnd) - timeToMinutes(operatingStart)) / 60;

    // Group by door + date
    type DoorDateKey = string;
    const byDoorDate = new Map<DoorDateKey, { doorId: number; date: string; minutesUsed: number }>();

    for (const a of rows) {
      const key = `${a.dock_door_id}:${a.scheduled_date}`;
      const existing = byDoorDate.get(key) ?? { doorId: a.dock_door_id, date: a.scheduled_date, minutesUsed: 0 };
      byDoorDate.set(key, {
        ...existing,
        minutesUsed: existing.minutesUsed + a.duration_minutes,
      });
    }

    const result = Array.from(byDoorDate.values()).map((entry) => {
      const door = doors.find((d) => d.id === entry.doorId);
      const hoursUsed = entry.minutesUsed / 60;
      const utilization = hoursAvailable > 0 ? Math.round((hoursUsed / hoursAvailable) * 100) : 0;
      return {
        door: door?.name ?? `Door ${entry.doorId}`,
        date: entry.date,
        hours_used: Math.round(hoursUsed * 10) / 10,
        hours_available: hoursAvailable,
        utilization_pct: utilization,
      };
    });

    result.sort((a, b) => a.date.localeCompare(b.date) || a.door.localeCompare(b.door));

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
