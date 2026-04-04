import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { eq, and, gte, lte, ne } from 'drizzle-orm';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: start.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date();
    const currentHHMM = `${String(nowTime.getHours()).padStart(2, '0')}:${String(nowTime.getMinutes()).padStart(2, '0')}`;
    const twoHoursLater = new Date(nowTime.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursLaterHHMM = `${String(twoHoursLater.getHours()).padStart(2, '0')}:${String(twoHoursLater.getMinutes()).padStart(2, '0')}`;

    const [facility] = await db.select().from(facilities).limit(1);
    const doors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

    const todayAppts = await db
      .select()
      .from(appointments)
      .where(eq(appointments.scheduled_date, today));

    // Status counts
    const statusCounts: Record<string, number> = {
      scheduled: 0,
      checked_in: 0,
      in_progress: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0,
    };
    for (const a of todayAppts) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
    }

    // Current door occupants
    const activeDoors = doors.filter((d) => d.status === 'active');
    const dockStatus = activeDoors.map((door) => {
      const occupant = todayAppts.find(
        (a) =>
          a.dock_door_id === door.id &&
          ['checked_in', 'in_progress'].includes(a.status)
      );
      return {
        door,
        occupant: occupant ?? null,
        status: occupant ? occupant.status : 'available',
      };
    });

    // Dwell averages: today
    const todayCompleted = todayAppts.filter((a) => a.status === 'completed');
    const avgWaitToday =
      todayCompleted.length > 0
        ? Math.round(todayCompleted.reduce((s, a) => s + (a.wait_minutes ?? 0), 0) / todayCompleted.length)
        : null;
    const avgDockToday =
      todayCompleted.length > 0
        ? Math.round(todayCompleted.reduce((s, a) => s + (a.dock_minutes ?? 0), 0) / todayCompleted.length)
        : null;
    const avgTotalToday =
      todayCompleted.length > 0
        ? Math.round(todayCompleted.reduce((s, a) => s + (a.total_dwell_minutes ?? 0), 0) / todayCompleted.length)
        : null;

    // Week averages
    const week = getWeekRange();
    const weekAppts = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduled_date, week.from),
          lte(appointments.scheduled_date, week.to),
          eq(appointments.status, 'completed')
        )
      );
    const avgTotalWeek =
      weekAppts.length > 0
        ? Math.round(weekAppts.reduce((s, a) => s + (a.total_dwell_minutes ?? 0), 0) / weekAppts.length)
        : null;

    // Month averages
    const month = getMonthRange();
    const monthAppts = await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduled_date, month.from),
          lte(appointments.scheduled_date, month.to),
          eq(appointments.status, 'completed')
        )
      );
    const avgTotalMonth =
      monthAppts.length > 0
        ? Math.round(monthAppts.reduce((s, a) => s + (a.total_dwell_minutes ?? 0), 0) / monthAppts.length)
        : null;

    // Upcoming: scheduled in next 2 hours
    const currentMinutes = timeToMinutes(currentHHMM);
    const twoHoursMinutes = timeToMinutes(twoHoursLaterHHMM);
    const upcoming = todayAppts.filter((a) => {
      if (a.status !== 'scheduled') return false;
      const t = timeToMinutes(a.scheduled_time);
      return t >= currentMinutes && t <= twoHoursMinutes;
    });

    // Late arrivals: past scheduled_time, still scheduled
    const lateArrivals = todayAppts.filter((a) => {
      if (a.status !== 'scheduled') return false;
      const t = timeToMinutes(a.scheduled_time);
      return t < currentMinutes;
    });

    return NextResponse.json({
      facility,
      statusCounts,
      dockStatus,
      dwellAverages: {
        today: { avgWait: avgWaitToday, avgDock: avgDockToday, avgTotal: avgTotalToday },
        week: { avgTotal: avgTotalWeek },
        month: { avgTotal: avgTotalMonth },
      },
      upcoming,
      lateArrivals,
      doors,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
