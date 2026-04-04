'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { DockDoor } from '@/db/schema';
import { Filter } from 'lucide-react';

interface CalendarFiltersProps {
  doors: DockDoor[];
  typeFilter: string;
  carrierFilter: string;
  doorFilter: number[];
}

export function CalendarFilters({ doors, typeFilter, carrierFilter, doorFilter }: CalendarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendar?${params.toString()}`);
  }

  function toggleDoor(doorId: number) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll('doors').map(Number);
    const next = current.includes(doorId)
      ? current.filter((id) => id !== doorId)
      : [...current, doorId];
    params.delete('doors');
    for (const id of next) params.append('doors', String(id));
    router.push(`/calendar?${params.toString()}`);
  }

  const activeDoors = doors.filter((d) => d.status === 'active');

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[#1A2235] bg-[#080F1E]">
      <div className="flex items-center gap-1.5 text-xs text-[#8B95A5] font-medium">
        <Filter className="h-3.5 w-3.5" />
        Filters
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1">
        {(['all', 'inbound', 'outbound'] as const).map((type) => (
          <button
            key={type}
            onClick={() => updateParam('type', type === 'all' ? '' : type)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              (type === 'all' && !typeFilter) || typeFilter === type
                ? 'bg-[#0C1528] text-white border border-[#1A2235]'
                : 'text-[#8B95A5] hover:text-white'
            }`}
          >
            {type === 'all' ? 'All types' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Carrier search */}
      <input
        type="text"
        value={carrierFilter}
        onChange={(e) => updateParam('carrier', e.target.value)}
        placeholder="Search carrier..."
        className="px-2.5 py-1 text-xs rounded-md bg-[#040810] border border-[#1A2235] text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 w-36"
      />

      {/* Door filter chips */}
      <div className="flex flex-wrap items-center gap-1">
        {activeDoors.map((door) => {
          const active = doorFilter.includes(door.id);
          return (
            <button
              key={door.id}
              onClick={() => toggleDoor(door.id)}
              className={`px-2 py-0.5 text-[10px] rounded border font-medium transition-colors ${
                active
                  ? 'bg-[#00C650]/15 text-[#00C650] border-[#00C650]/30'
                  : 'bg-transparent text-[#8B95A5] border-[#1A2235] hover:border-[#8B95A5]/40 hover:text-white'
              }`}
            >
              {door.name}
            </button>
          );
        })}
        {doorFilter.length > 0 && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('doors');
              router.push(`/calendar?${params.toString()}`);
            }}
            className="px-2 py-0.5 text-[10px] rounded border border-[#FF4444]/30 text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
