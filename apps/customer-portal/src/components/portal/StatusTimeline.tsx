'use client';

import type { ShipmentStatus } from '@/db/schema';

const STEPS = [
  { key: 'booked', label: 'Booked' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'at_pickup', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function stepIndex(status: string): number {
  const map: Record<string, number> = {
    quote: -1,
    booked: 0,
    dispatched: 1,
    at_pickup: 2,
    in_transit: 3,
    at_delivery: 3,
    delivered: 4,
    invoiced: 4,
    closed: 4,
    cancelled: -2,
  };
  return map[status] ?? -1;
}

interface StatusTimelineProps {
  status: ShipmentStatus;
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const currentIdx = stepIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="relative py-2">
      {isCancelled && (
        <div className="mb-3 inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Cancelled
        </div>
      )}

      {/* Desktop horizontal */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && currentIdx >= idx;
          const isCurrent = !isCancelled && currentIdx === idx;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {idx > 0 && (
                <div
                  className={`absolute top-3 right-1/2 w-full h-0.5 transition-colors ${
                    isCompleted ? 'bg-[#00C650]' : 'bg-[#1A2235]'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-[#00C650] border-[#00C650]'
                    : 'bg-[#040810] border-[#1A2235]'
                } ${isCurrent ? 'ring-4 ring-[#00C650]/25' : ''}`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1A2235]" />
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center leading-tight ${
                  isCompleted ? 'text-[#00C650]' : 'text-[#8B95A5]'
                } ${isCurrent ? 'font-semibold' : ''}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="flex sm:hidden flex-col gap-4">
        {STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && currentIdx >= idx;
          const isCurrent = !isCancelled && currentIdx === idx;

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
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  isCompleted
                    ? 'bg-[#00C650] border-[#00C650]'
                    : 'bg-[#040810] border-[#1A2235]'
                } ${isCurrent ? 'ring-4 ring-[#00C650]/25' : ''}`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1A2235]" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isCompleted ? 'text-[#00C650]' : 'text-[#8B95A5]'
                } ${isCurrent ? 'font-semibold' : ''}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
