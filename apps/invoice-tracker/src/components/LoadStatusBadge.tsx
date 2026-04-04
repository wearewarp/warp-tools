type LoadStatus = 'booked' | 'in_transit' | 'delivered' | 'invoiced' | 'closed';

const STATUS_CONFIG: Record<LoadStatus, { label: string; color: string; bg: string }> = {
  booked:     { label: 'Booked',     color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' },
  in_transit: { label: 'In Transit', color: '#4B8EE8', bg: 'rgba(75, 142, 232, 0.12)' },
  delivered:  { label: 'Delivered',  color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  invoiced:   { label: 'Invoiced',   color: '#00C650', bg: 'rgba(0, 198, 80, 0.12)' },
  closed:     { label: 'Closed',     color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' },
};

interface LoadStatusBadgeProps {
  status: LoadStatus | string;
  size?: 'sm' | 'md';
}

export function LoadStatusBadge({ status, size = 'md' }: LoadStatusBadgeProps) {
  const config = STATUS_CONFIG[status as LoadStatus] ?? {
    label: status,
    color: '#8B95A5',
    bg: 'rgba(139, 149, 165, 0.12)',
  };

  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const dotSize = size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${textSize}`}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span className={`${dotSize} rounded-full flex-shrink-0`} style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
