import { Clock, MapPin } from 'lucide-react';

interface Event {
  id: string;
  eventType: string;
  description: string;
  locationCity: string | null;
  locationState: string | null;
  createdAt: string | null;
}

interface EventListProps {
  events: Event[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  status_change: 'Status Update',
  check_call: 'Check Call',
  note: 'Note',
  document_added: 'Document Added',
  invoice_update: 'Invoice Update',
};

function formatDateTime(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[#8B95A5] text-sm">
        No updates yet. Updates will appear here as your shipment progresses.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#1A2235]" />
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4 relative">
            <div className="relative z-10 mt-0.5 w-6 h-6 rounded-full bg-[#0A1628] border border-[#1A2235] flex items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#00C650]" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium text-[#00C650] uppercase tracking-wide">
                  {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                </span>
                <span className="text-xs text-[#8B95A5] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(event.createdAt)}
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed">{event.description}</p>
              {event.locationCity && (
                <p className="text-xs text-[#8B95A5] mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.locationCity}, {event.locationState}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
