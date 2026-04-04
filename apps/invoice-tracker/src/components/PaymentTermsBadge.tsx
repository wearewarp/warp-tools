type PaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'quick_pay' | 'factored';

interface PaymentTermsBadgeProps {
  terms: PaymentTerms;
}

const CONFIG: Record<PaymentTerms, { label: string; className: string }> = {
  net_15: {
    label: 'Net 15',
    className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
  },
  net_30: {
    label: 'Net 30',
    className: 'bg-[#4B8EE8]/10 text-[#4B8EE8] border-[#4B8EE8]/20',
  },
  net_45: {
    label: 'Net 45',
    className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
  },
  net_60: {
    label: 'Net 60',
    className: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/20',
  },
  quick_pay: {
    label: 'Quick Pay',
    className: 'bg-[#00C650]/15 text-[#00C650] border-[#00C650]/30',
  },
  factored: {
    label: 'Factored',
    className: 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20',
  },
};

export function PaymentTermsBadge({ terms }: PaymentTermsBadgeProps) {
  const cfg = CONFIG[terms] ?? CONFIG.net_30;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
