import { cn } from '@/lib/utils';

type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-[#8B95A5]/15 text-[#8B95A5] border border-[#8B95A5]/20',
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  },
  partially_paid: {
    label: 'Partial',
    className: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  },
  paid: {
    label: 'Paid',
    className: 'bg-[#00C650]/15 text-[#00C650] border border-[#00C650]/20',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-500/15 text-red-400 border border-red-500/20',
  },
  void: {
    label: 'Void',
    className: 'bg-[#8B95A5]/10 text-[#8B95A5]/50 border border-[#8B95A5]/10',
  },
};

interface InvoiceStatusBadgeProps {
  status: string;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status as InvoiceStatus] ?? {
    label: status,
    className: 'bg-[#8B95A5]/15 text-[#8B95A5] border border-[#8B95A5]/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        status === 'void' && 'line-through',
        className
      )}
    >
      {config.label}
    </span>
  );
}
