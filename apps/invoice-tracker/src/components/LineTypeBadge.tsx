import { cn } from '@/lib/utils';

type LineType = 'freight' | 'fuel_surcharge' | 'accessorial' | 'detention' | 'lumper' | 'other';

const LINE_TYPE_CONFIG: Record<LineType, { label: string; className: string }> = {
  freight: {
    label: 'Freight',
    className: 'bg-[#00C650]/15 text-[#00C650] border border-[#00C650]/20',
  },
  fuel_surcharge: {
    label: 'Fuel',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  accessorial: {
    label: 'Accessorial',
    className: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  },
  detention: {
    label: 'Detention',
    className: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  },
  lumper: {
    label: 'Lumper',
    className: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  },
  other: {
    label: 'Other',
    className: 'bg-[#8B95A5]/15 text-[#8B95A5] border border-[#8B95A5]/20',
  },
};

interface LineTypeBadgeProps {
  lineType: string;
  className?: string;
}

export function LineTypeBadge({ lineType, className }: LineTypeBadgeProps) {
  const config = LINE_TYPE_CONFIG[lineType as LineType] ?? {
    label: lineType,
    className: 'bg-[#8B95A5]/15 text-[#8B95A5] border border-[#8B95A5]/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
