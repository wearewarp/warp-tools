interface PaymentStatusBadgeProps {
  status: 'pending' | 'approved' | 'paid' | 'disputed';
}

const CONFIG = {
  pending: {
    label: 'Pending',
    className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
    dot: '#8B95A5',
  },
  approved: {
    label: 'Approved',
    className: 'bg-[#4B8EE8]/10 text-[#4B8EE8] border-[#4B8EE8]/20',
    dot: '#4B8EE8',
  },
  paid: {
    label: 'Paid',
    className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
    dot: '#00C650',
  },
  disputed: {
    label: 'Disputed',
    className: 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20',
    dot: '#FF4444',
  },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${cfg.className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}
