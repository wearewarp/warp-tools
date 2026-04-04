import { formatDuration } from '@/lib/utils';

interface Props {
  minutes: number | null | undefined;
  showLabel?: boolean;
}

export function DwellTimeDisplay({ minutes, showLabel = false }: Props) {
  if (minutes == null) return <span className="text-[#8B95A5]">—</span>;

  const colorClass =
    minutes < 45
      ? 'text-[#00C650]'
      : minutes < 90
      ? 'text-[#FFAA00]'
      : 'text-[#FF4444]';

  return (
    <span className={`font-medium ${colorClass}`}>
      {formatDuration(minutes)}
      {showLabel && (
        <span className="text-xs text-[#8B95A5] ml-1">
          {minutes < 45 ? 'good' : minutes < 90 ? 'slow' : 'long'}
        </span>
      )}
    </span>
  );
}
