import { cn, getPayTypeLabel, getPayTypeColor } from '@/lib/utils';
import type { PayType } from '@/db/schema';

interface PayTypeBadgeProps {
  type: PayType;
  className?: string;
}

export function PayTypeBadge({ type, className }: PayTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        getPayTypeColor(type),
        className
      )}
    >
      {getPayTypeLabel(type)}
    </span>
  );
}
