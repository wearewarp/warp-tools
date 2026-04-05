'use client';

import { ArrowRight, MapPin, MessageSquare, FileText, DollarSign } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface EventItem {
  id: string;
  eventType: string;
  description: string;
  locationCity: string | null;
  locationState: string | null;
  isVisibleToCustomer: boolean | null;
  createdAt: string | null;
}

interface EventTimelineProps {
  events: EventItem[];
  onDelete?: (eventId: string) => void;
}

const iconMap: Record<string, typeof ArrowRight> = {
  status_change: ArrowRight,
  check_call: MapPin,
  note: MessageSquare,
  document_added: FileText,
  invoice_update: DollarSign,
};

export function EventTimeline({ events, onDelete }: EventTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-[#8B95A5] py-4">No events yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((ev) => {
        const Icon = iconMap[ev.eventType] ?? MessageSquare;
        const isInternal = ev.isVisibleToCustomer === false;
        const hasLocation = ev.locationCity || ev.locationState;

        return (
          <div key={ev.id} className="flex gap-3 group">
            <div className="shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-[#080F1E] border border-[#1A2235] flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-[#8B95A5]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <p className="text-sm text-slate-200">{ev.description}</p>
                {isInternal && (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[#1A2235] text-[#8B95A5] font-medium">
                    Internal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {hasLocation && (
                  <span className="text-xs text-[#8B95A5] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[ev.locationCity, ev.locationState].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="text-xs text-[#8B95A5]">{formatDateTime(ev.createdAt)}</span>
              </div>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(ev.id)}
                className="opacity-0 group-hover:opacity-100 shrink-0 text-xs text-[#FF4444] hover:text-[#FF4444]/80 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
