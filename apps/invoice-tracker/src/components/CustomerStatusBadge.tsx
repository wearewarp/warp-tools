interface CustomerStatusBadgeProps {
  status: 'active' | 'inactive' | 'on_hold';
}

const CONFIG = {
  active: {
    label: 'Active',
    className: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
    dot: '#00C650',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
    dot: '#8B95A5',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/20',
    dot: '#FFAA00',
  },
};

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.inactive;
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
