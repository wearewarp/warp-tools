interface PayTypeBadgeProps {
  payType: 'standard' | 'quick_pay' | 'hold';
}

const CONFIG = {
  standard: {
    label: 'Standard',
    className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
  },
  quick_pay: {
    label: 'Quick Pay',
    className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
  },
  hold: {
    label: 'Hold',
    className: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/20',
  },
};

export function PayTypeBadge({ payType }: PayTypeBadgeProps) {
  const cfg = CONFIG[payType] ?? CONFIG.standard;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
