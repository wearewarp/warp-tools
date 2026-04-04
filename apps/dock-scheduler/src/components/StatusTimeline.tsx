import type { Appointment, AppointmentStatus } from '@/db/schema';

interface Props {
  appointment: Appointment;
}

function formatTs(ts: string | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const STEPS: { key: AppointmentStatus; label: string; tsField: keyof Appointment }[] = [
  { key: 'scheduled', label: 'Scheduled', tsField: 'created_at' },
  { key: 'checked_in', label: 'Checked In', tsField: 'checked_in_at' },
  { key: 'in_progress', label: 'In Progress', tsField: 'in_progress_at' },
  { key: 'completed', label: 'Completed', tsField: 'completed_at' },
];

const STATUS_RANK: Record<string, number> = {
  scheduled: 0,
  checked_in: 1,
  in_progress: 2,
  completed: 3,
  no_show: 1,
  cancelled: 1,
};

export function StatusTimeline({ appointment }: Props) {
  const currentRank = STATUS_RANK[appointment.status] ?? 0;
  const isNoShow = appointment.status === 'no_show';
  const isCancelled = appointment.status === 'cancelled';

  return (
    <div className="flex items-start gap-0 w-full">
      {STEPS.map((step, i) => {
        const stepRank = STATUS_RANK[step.key] ?? 0;
        const isDone = stepRank < currentRank || (step.key === appointment.status);
        const isActive = step.key === appointment.status;
        const ts = appointment[step.tsField] as string | null | undefined;
        const isLast = i === STEPS.length - 1;

        let dotClass = 'bg-[#1A2235] border-[#1A2235]';
        if (isDone && !isNoShow && !isCancelled) {
          dotClass = isActive
            ? 'bg-[#00C650] border-[#00C650] ring-2 ring-[#00C650]/30'
            : 'bg-[#00C650] border-[#00C650]';
        } else if (isActive && isNoShow) {
          dotClass = 'bg-[#FF9500] border-[#FF9500] ring-2 ring-[#FF9500]/30';
        } else if (isActive && isCancelled) {
          dotClass = 'bg-[#FF4444] border-[#FF4444] ring-2 ring-[#FF4444]/30';
        }

        const lineClass = stepRank < currentRank && !isNoShow && !isCancelled
          ? 'bg-[#00C650]'
          : 'bg-[#1A2235]';

        return (
          <div key={step.key} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-3 h-3 rounded-full border-2 ${dotClass} transition-colors`} />
              <div className="text-center mt-1.5 min-w-[60px]">
                <div className={`text-xs font-medium ${isDone || isActive ? 'text-white' : 'text-[#8B95A5]'}`}>
                  {step.label}
                </div>
                {ts && (
                  <div className="text-xs text-[#8B95A5] mt-0.5">{formatTs(ts)}</div>
                )}
              </div>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mt-1.5 mx-1 ${lineClass} transition-colors`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
