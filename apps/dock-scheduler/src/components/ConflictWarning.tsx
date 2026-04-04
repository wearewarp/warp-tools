import { formatTime } from '@/lib/utils';

interface Conflict {
  id: number;
  carrier_name: string | null;
  scheduled_time: string;
  end_time: string | null;
  status: string;
}

interface Props {
  conflicts: Conflict[];
}

export function ConflictWarning({ conflicts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#FF4444]/30 bg-[#FF4444]/5 p-3">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-[#FF4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <div className="text-sm font-semibold text-[#FF4444]">Scheduling Conflict</div>
          <div className="text-xs text-[#8B95A5] mt-1">
            This time slot overlaps with {conflicts.length} existing appointment{conflicts.length !== 1 ? 's' : ''}:
          </div>
          <ul className="mt-1.5 space-y-1">
            {conflicts.map((c) => (
              <li key={c.id} className="text-xs text-slate-300">
                • {c.carrier_name ?? 'Unknown carrier'} — {formatTime(c.scheduled_time)}
                {c.end_time ? ` to ${formatTime(c.end_time)}` : ''}
                <span className="text-[#8B95A5] ml-1">({c.status})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
