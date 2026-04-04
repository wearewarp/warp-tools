import { getUrgencyLevel } from '@/lib/utils';

interface UrgencyIndicatorProps {
  pickupDate: string | null | undefined;
  showLabel?: boolean;
}

export function UrgencyIndicator({ pickupDate, showLabel = false }: UrgencyIndicatorProps) {
  const level = getUrgencyLevel(pickupDate);

  const colorMap = {
    urgent: 'bg-red-500',
    soon: 'bg-yellow-400',
    normal: 'bg-green-500',
  };

  const labelMap = {
    urgent: 'Today',
    soon: 'Tomorrow',
    normal: 'Later',
  };

  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[level]}`} />
      {showLabel && (
        <span className={`text-xs ${level === 'urgent' ? 'text-red-400' : level === 'soon' ? 'text-yellow-400' : 'text-green-400'}`}>
          {labelMap[level]}
        </span>
      )}
    </span>
  );
}

export function getUrgencyBorderClass(pickupDate: string | null | undefined): string {
  const level = getUrgencyLevel(pickupDate);
  switch (level) {
    case 'urgent': return 'border-l-red-500';
    case 'soon': return 'border-l-yellow-400';
    default: return 'border-l-green-500';
  }
}
