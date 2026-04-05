'use client';

import type { ShipmentStatus } from '@/db/schema';

const STEPS = [
  { key: 'booked', label: 'Booked' },
  { key: 'at_pickup', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function stepIndex(status: string): number {
  const map: Record<string, number> = {
    quote: -1,
    booked: 0,
    at_pickup: 1,
    in_transit: 2,
    at_delivery: 3,
    delivered: 3,
    invoiced: 4,
    closed: 4,
    cancelled: -2,
  };
  return map[status] ?? -1;
}

interface StatusTimelineProps {
  status: ShipmentStatus;
  events?: Array<{ eventType: string; description: string; createdAt: string | null }>;
}

export function StatusTimeline({ status, events = [] }: StatusTimelineProps) {
  const currentIdx = stepIndex(status);
  const isCancelled = status === 'cancelled';

  const statusTimestamps: Record<string, string> = {};
  for (const ev of events) {
    if (ev.eventType === 'status_change' && ev.createdAt) {
      const desc = ev.description.toLowerCase();
      for (const step of STEPS) {
        if (desc.includes(step.key) || desc.includes(step.label.toLowerCase())) {
          if (!statusTimestamps[step.key]) {
            statusTimestamps[step.key] = ev.createdAt;
          }
        }
      }
    }
  }

  return (
    <div className="relative">
      {isCancelled && (
        <div className="absolute -top-2 -right-2 bg-[#FF4444]/10 text-[#FF4444] text-xs font-medium px-2 py-0.5 rounded-full border border-[#FF4444]/20 z-10">
          Cancelled
        </div>
      )}

      {/* Desktop horizontal */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && currentIdx >= idx;
          const isCurrent = !isCancelled && currentIdx === idx;
          const ts = statusTimestamps[step.key];

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {idx > 0 && (
                <div
                  className={`absolute top-3 -left-1/2 w-full h-0.5 ${
                    isCompleted ? 'bg-[#00C650]' : 'bg-[#1A2235]'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? 'bg-[#00C650] border-[#00C650]'
                    : 'bg-[#040810] border-[#1A2235]'
                } ${isCurrent ? 'ring-4 ring-[#00C650]/20' : ''}`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCompleted ? 'text-[#00C650]' : 'text-[#8B95A5]'
                }`}
              >
                {step.label}
              </span>
              {ts && (
                <span className="mt-0.5 text-[10px] text-[#8B95A5]">
                  {new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex sm:hidden flex-col gap-4">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && currentIdx >= idx;
          const isCurrent = !isCancelled && currentIdx === idx;
          const ts = statusTimestamps[step.key];

          return (
            <div key={step.key} className="flex items-center gap-3 relative">
              {idx > 0 && (
                <div
                  className={`absolute left-3 -top-4 w-0.5 h-4 ${
                    isCompleted ? 'bg-[#00C650]' : 'bg-[#1A2235]'
                  }`}
                />
              )}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  isCompleted
                    ? 'bg-[#00C650] border-[#00C650]'
                    : 'bg-[#040810] border-[#1A2235]'
                } ${isCurrent ? 'ring-4 ring-[#00C650]/20' : ''}`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <span className={`text-xs font-medium ${isCompleted ? 'text-[#00C650]' : 'text-[#8B95A5]'}`}>
                  {step.label}
                </span>
                {ts && (
                  <span className="ml-2 text-[10px] text-[#8B95A5]">
                    {new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
