interface MarginIndicatorProps {
  revenue: number;
  cost: number;
  showDollar?: boolean;
  showPct?: boolean;
  size?: 'sm' | 'md';
}

export function getMarginColor(marginPct: number): string {
  if (marginPct >= 15) return '#00C650'; // green
  if (marginPct >= 10) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

export function getMarginBg(marginPct: number): string {
  if (marginPct >= 15) return 'rgba(0, 198, 80, 0.1)';
  if (marginPct >= 10) return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(239, 68, 68, 0.1)';
}

export function MarginIndicator({
  revenue,
  cost,
  showDollar = true,
  showPct = true,
  size = 'md',
}: MarginIndicatorProps) {
  const margin = revenue - cost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
  const color = getMarginColor(marginPct);
  const bg = getMarginBg(marginPct);

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-medium ${textSize}`}
      style={{ color, backgroundColor: bg }}
    >
      {showDollar && (
        <span>${margin.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
      )}
      {showDollar && showPct && <span className="opacity-50">·</span>}
      {showPct && <span>{marginPct.toFixed(1)}%</span>}
    </span>
  );
}
