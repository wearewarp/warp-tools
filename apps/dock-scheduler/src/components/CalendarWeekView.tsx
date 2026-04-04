'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DockDoor, Facility } from '@/db/schema';

function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const base = new Date(weekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDay(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
  };
}

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-transparent';
  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.75) return 'bg-[#00C650]/40 text-[#00C650]';
  if (ratio > 0.5) return 'bg-[#00C650]/25 text-[#4ADE80]';
  if (ratio > 0.25) return 'bg-[#00C650]/15 text-[#6EE7B7]';
  return 'bg-[#00C650]/8 text-[#8B95A5]';
}

interface CalendarWeekViewProps {
  facility: Facility;
  doors: DockDoor[];
  dailySummary: Record<string, Record<number, number>>;
  weekStart: string;
  weekEnd: string;
}

export function CalendarWeekView({
  doors,
  dailySummary,
  weekStart,
}: CalendarWeekViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const days = getWeekDays(weekStart);
  const today = new Date().toISOString().split('T')[0];

  const activeDoors = doors.filter((d) => d.status === 'active');

  // Find max count for normalization
  let max = 0;
  for (const dayCounts of Object.values(dailySummary)) {
    for (const count of Object.values(dayCounts)) {
      if (count > max) max = count;
    }
  }

  function goToDay(dateStr: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', dateStr);
    params.set('view', 'day');
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#1A2235] bg-[#040810]">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(7, 1fr)`,
          gridTemplateRows: `48px repeat(${activeDoors.length}, 52px)`,
          minWidth: '680px',
        }}
      >
        {/* Corner */}
        <div className="bg-[#080F1E] border-r border-b border-[#1A2235] flex items-center px-3">
          <span className="text-[10px] text-[#8B95A5]">Door</span>
        </div>

        {/* Day headers */}
        {days.map((day) => {
          const { weekday, date: dateLabel } = formatDay(day);
          const isToday = day === today;
          return (
            <button
              key={day}
              onClick={() => goToDay(day)}
              className={`border-r border-b border-[#1A2235] flex flex-col items-center justify-center cursor-pointer hover:bg-[#0C1528] transition-colors ${
                isToday ? 'bg-[#00C650]/5' : 'bg-[#080F1E]'
              }`}
            >
              <span className={`text-[10px] font-medium uppercase tracking-wide ${isToday ? 'text-[#00C650]' : 'text-[#8B95A5]'}`}>
                {weekday}
              </span>
              <span className={`text-sm font-bold mt-0.5 ${isToday ? 'text-[#00C650]' : 'text-white'}`}>
                {dateLabel}
              </span>
            </button>
          );
        })}

        {/* Door rows */}
        {activeDoors.map((door) => (
          <React.Fragment key={door.id}>
            {/* Door label */}
            <div
              key={`label-${door.id}`}
              className="bg-[#080F1E] border-r border-b border-[#1A2235] flex flex-col justify-center px-3"
            >
              <div className="text-xs font-semibold text-white">{door.name}</div>
              <div className="text-[9px] text-[#8B95A5] mt-0.5">{door.door_type}</div>
            </div>

            {/* Day cells */}
            {days.map((day) => {
              const count = dailySummary[day]?.[door.id] ?? 0;
              const isToday = day === today;
              const cls = intensityClass(count, max);
              return (
                <button
                  key={`${door.id}-${day}`}
                  onClick={() => goToDay(day)}
                  className={`border-r border-b border-[#1A2235] flex items-center justify-center cursor-pointer hover:brightness-125 transition-all ${cls} ${
                    isToday ? 'ring-inset ring-1 ring-[#00C650]/20' : ''
                  }`}
                >
                  {count > 0 && (
                    <span className="text-xs font-bold">{count}</span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
