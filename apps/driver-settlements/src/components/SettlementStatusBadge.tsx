import { cn, getSettlementStatusColor, getSettlementStatusLabel } from '@/lib/utils';
import type { SettlementStatus } from '@/db/schema';

interface SettlementStatusBadgeProps {
  status: SettlementStatus;
  className?: string;
}

export function SettlementStatusBadge({ status, className }: SettlementStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getSettlementStatusColor(status),
        className
      )}
    >
      {getSettlementStatusLabel(status)}
    </span>
  );
}
