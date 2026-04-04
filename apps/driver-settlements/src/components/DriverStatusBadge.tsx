import { cn, getDriverStatusLabel, getDriverStatusColor } from '@/lib/utils';
import type { DriverStatus } from '@/db/schema';

interface DriverStatusBadgeProps {
  status: DriverStatus;
  className?: string;
}

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        getDriverStatusColor(status),
        className
      )}
    >
      {getDriverStatusLabel(status)}
    </span>
  );
}
