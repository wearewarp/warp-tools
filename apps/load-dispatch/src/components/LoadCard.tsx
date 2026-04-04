'use client';

import { useRouter } from 'next/navigation';
import type { Load } from '@/db/schema';
import { formatDate } from '@/lib/utils';
import { getUrgencyBorderClass } from '@/components/UrgencyIndicator';
import { LaneDisplay } from '@/components/LaneDisplay';
import { Clock, Truck } from 'lucide-react';

interface LoadCardProps {
  load: Load & { lastCheckCallAt?: string | null };
}

export function LoadCard({ load }: LoadCardProps) {
  const router = useRouter();
  const borderColor = getUrgencyBorderClass(load.pickup_date);

  function handleClick() {
    router.push(`/loads/${load.id}`);
  }

  function formatRelativeTime(isoStr: string | null | undefined): string {
    if (!isoStr) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(isoStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left rounded-lg bg-[#0A1628] border border-[#1A2235] border-l-4 ${borderColor} p-3 hover:bg-[#0E1E35] transition-colors cursor-pointer`}
    >
      {/* Load # */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[#00C650] text-xs font-bold">{load.load_number}</span>
        <span className="text-[10px] text-[#8B95A5]">{formatDate(load.pickup_date)}</span>
      </div>

      {/* Lane */}
      <div className="mb-1.5">
        <LaneDisplay
          originCity={load.origin_city}
          originState={load.origin_state}
          destCity={load.dest_city}
          destState={load.dest_state}
          compact
        />
      </div>

      {/* Customer */}
      <div className="text-[11px] text-[#8B95A5] mb-2 truncate">{load.customer_name}</div>

      {/* Carrier + check call */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Truck className="w-3 h-3 text-[#8B95A5] flex-shrink-0" />
          <span className="text-[11px] text-[#8B95A5] truncate">
            {load.carrier_name ?? <em className="not-italic opacity-40">Unassigned</em>}
          </span>
        </div>
        {load.lastCheckCallAt && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Clock className="w-2.5 h-2.5 text-[#8B95A5]" />
            <span className="text-[10px] text-[#8B95A5]">{formatRelativeTime(load.lastCheckCallAt)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
