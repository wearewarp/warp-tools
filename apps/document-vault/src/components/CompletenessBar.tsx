import { cn } from '@/lib/utils';

interface CompletenessBarProps {
  fulfilled: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function CompletenessBar({ fulfilled, total, showLabel = false, className }: CompletenessBarProps) {
  const pct = total === 0 ? 100 : Math.round((fulfilled / total) * 100);

  const barColor =
    pct === 100
      ? 'bg-[#00C650]'
      : pct >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-[#1A2235] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#8B95A5] tabular-nums w-10 text-right">
          {fulfilled}/{total}
        </span>
      )}
    </div>
  );
}
