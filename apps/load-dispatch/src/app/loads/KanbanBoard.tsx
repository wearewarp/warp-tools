'use client';

import type { Load } from '@/db/schema';
import { LoadCard } from '@/components/LoadCard';

type LoadWithCheckCall = Load & { lastCheckCallAt?: string | null };

interface KanbanColumn {
  id: string;
  label: string;
  statuses: string[];
  color: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: 'new', label: 'New', statuses: ['new'], color: 'text-slate-300' },
  { id: 'posted', label: 'Posted', statuses: ['posted'], color: 'text-blue-400' },
  { id: 'covered', label: 'Covered', statuses: ['covered'], color: 'text-purple-400' },
  { id: 'dispatched', label: 'Dispatched', statuses: ['dispatched', 'picked_up'], color: 'text-yellow-400' },
  { id: 'in_transit', label: 'In Transit', statuses: ['in_transit'], color: 'text-cyan-400' },
  { id: 'delivered', label: 'Delivered', statuses: ['delivered'], color: 'text-green-400' },
];

interface KanbanBoardProps {
  loads: LoadWithCheckCall[];
}

export function KanbanBoard({ loads }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-0" style={{ height: 'calc(100vh - 220px)' }}>
      {COLUMNS.map((col) => {
        const colLoads = loads.filter((l) => col.statuses.includes(l.status));

        return (
          <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
              <span className="text-xs text-[#8B95A5] bg-[#1A2235] px-2 py-0.5 rounded-full">
                {colLoads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
              {colLoads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#1A2235] p-4 text-center text-xs text-[#8B95A5]/50">
                  No loads
                </div>
              ) : (
                colLoads.map((load) => (
                  <LoadCard key={load.id} load={load} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
