'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from 'lucide-react';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string, view: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (view === 'week') {
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', opts)} – ${sunday.toLocaleDateString('en-US', opts)}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

interface CalendarNavProps {
  date: string;
  view: string;
}

export function CalendarNav({ date, view }: CalendarNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newDate: string, newView?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    if (newView) params.set('view', newView);
    router.push(`/calendar?${params.toString()}`);
  }

  const step = view === 'week' ? 7 : 1;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(addDays(date, -step))}
          className="p-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:bg-[#0C1528] hover:text-white transition-colors"
          title="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => navigate(today)}
          disabled={date === today && view === 'day'}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1A2235] text-[#8B95A5] hover:bg-[#0C1528] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          Today
        </button>

        <button
          onClick={() => navigate(addDays(date, step))}
          className="p-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:bg-[#0C1528] hover:text-white transition-colors"
          title="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Date picker */}
        <div className="relative">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) navigate(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1A2235] text-sm font-medium text-white cursor-pointer hover:bg-[#0C1528] transition-colors">
            <CalendarDays className="h-3.5 w-3.5 text-[#8B95A5]" />
            {formatDisplayDate(date, view)}
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-[#1A2235] bg-[#040810] p-1">
        <button
          onClick={() => navigate(date, 'day')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            view === 'day'
              ? 'bg-[#0C1528] text-white'
              : 'text-[#8B95A5] hover:text-white'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Day
        </button>
        <button
          onClick={() => navigate(date, 'week')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            view === 'week'
              ? 'bg-[#0C1528] text-white'
              : 'text-[#8B95A5] hover:text-white'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Week
        </button>
      </div>
    </div>
  );
}
