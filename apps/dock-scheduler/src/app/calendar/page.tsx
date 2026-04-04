export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { CalendarNav } from '@/components/CalendarNav';
import { CalendarDayView } from '@/components/CalendarDayView';
import { CalendarWeekView } from '@/components/CalendarWeekView';
import { CalendarFilters } from '@/components/CalendarFilters';

function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
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

interface PageProps {
  searchParams: Promise<{
    date?: string;
    view?: string;
    type?: string;
    carrier?: string;
    doors?: string | string[];
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  const date = params.date ?? today;
  const view = params.view ?? 'day';
  const typeFilter = params.type ?? '';
  const carrierFilter = params.carrier ?? '';
  const doorFilterRaw = params.doors;
  const doorFilter: number[] = doorFilterRaw
    ? (Array.isArray(doorFilterRaw) ? doorFilterRaw : [doorFilterRaw]).map(Number).filter(Boolean)
    : [];

  const [facility] = await db.select().from(facilities).limit(1);

  const doors = facility
    ? await db
        .select()
        .from(dockDoors)
        .where(eq(dockDoors.facility_id, facility.id))
        .orderBy(dockDoors.sort_order)
    : [];

  let dayAppointments: (typeof appointments.$inferSelect)[] = [];
  let dailySummary: Record<string, Record<number, number>> = {};
  let weekStart = date;
  let weekEnd = date;

  if (facility) {
    if (view === 'week') {
      const bounds = getWeekBounds(date);
      weekStart = bounds.weekStart;
      weekEnd = bounds.weekEnd;

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

      for (const appt of weekAppts) {
        if (!dailySummary[appt.scheduled_date]) {
          dailySummary[appt.scheduled_date] = {};
        }
        dailySummary[appt.scheduled_date][appt.dock_door_id] =
          (dailySummary[appt.scheduled_date][appt.dock_door_id] ?? 0) + 1;
      }
    } else {
      dayAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.facility_id, facility.id),
            eq(appointments.scheduled_date, date)
          )
        )
        .orderBy(appointments.scheduled_time);
    }
  }

  if (!facility) {
    return (
      <div className="p-6 text-[#8B95A5] text-sm">
        No facility found. Please run the seed script first.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-sm text-[#8B95A5] mt-0.5">{facility.name}</p>
      </div>

      {/* Navigation */}
      <Suspense>
        <CalendarNav date={date} view={view} />
      </Suspense>

      {/* Filters */}
      <Suspense>
        <CalendarFilters
          doors={doors}
          typeFilter={typeFilter}
          carrierFilter={carrierFilter}
          doorFilter={doorFilter}
        />
      </Suspense>

      {/* Main calendar view */}
      <Suspense fallback={<div className="h-96 rounded-xl bg-[#080F1E] border border-[#1A2235] animate-pulse" />}>
        {view === 'week' ? (
          <CalendarWeekView
            facility={facility}
            doors={doors}
            dailySummary={dailySummary}
            weekStart={weekStart}
            weekEnd={weekEnd}
          />
        ) : (
          <CalendarDayView
            facility={facility}
            doors={doors}
            appointments={dayAppointments}
            date={date}
            typeFilter={typeFilter}
            carrierFilter={carrierFilter}
            doorFilter={doorFilter}
          />
        )}
      </Suspense>

      {/* Legend */}
      {view === 'day' && (
        <div className="flex flex-wrap items-center gap-4 px-1">
          {[
            { label: 'Scheduled', color: '#3B82F6' },
            { label: 'Checked In', color: '#FFAA00' },
            { label: 'In Progress', color: '#00C650' },
            { label: 'Completed', color: '#8B95A5' },
            { label: 'No Show', color: '#FF4444' },
            { label: 'Cancelled', color: '#555' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color, opacity: 0.8 }}
              />
              <span className="text-[10px] text-[#8B95A5]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
