import { cn, getDocTypeLabel, getDocTypeColor } from '@/lib/utils';
import type { DocType } from '@/db/schema';

interface Props {
  docType: DocType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DocumentTypeBadge({ docType, size = 'md', className }: Props) {
  const label = getDocTypeLabel(docType);
  const colors = getDocTypeColor(docType);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm',
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}
