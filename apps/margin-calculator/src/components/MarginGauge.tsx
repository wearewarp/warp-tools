'use client';

import { marginColor } from '@/lib/calc';

interface MarginGaugeProps {
  marginPercent: number;
  grossMargin: number;
  revenue: number;
}

export default function MarginGauge({ marginPercent, grossMargin, revenue }: MarginGaugeProps) {
  // Half-circle gauge: -180deg to 0deg maps to 0% to 100%
  // SVG arc approach: center 100,100, radius 80
  const clampedPct = Math.max(0, Math.min(100, marginPercent));
  const color = marginColor(marginPercent);

  // Arc from 180deg to (180 - pct*1.8)deg
  const angle = 180 - clampedPct * 1.8;
  const angleRad = (angle * Math.PI) / 180;
  const cx = 100;
  const cy = 100;
  const r = 78;

  const startX = cx + r * Math.cos(Math.PI); // leftmost point
  const startY = cy + r * Math.sin(Math.PI);
  const endX = cx + r * Math.cos(angleRad);
  const endY = cy + r * Math.sin(angleRad);

  const largeArc = clampedPct > 50 ? 1 : 0;

  const arcPath =
    clampedPct === 0
      ? ''
      : `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;

  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

  // Needle
  const needleAngle = 180 - clampedPct * 1.8;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = 60;
  const nx2 = cx + needleLen * Math.cos(needleRad);
  const ny2 = cy + needleLen * Math.sin(needleRad);

  const label = marginPercent.toFixed(1) + '%';
  const marginLabel =
    grossMargin >= 0
      ? '+$' + grossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-$' + Math.abs(grossMargin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-xs" aria-label={`Margin gauge: ${label}`}>
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#1A2235" strokeWidth="14" strokeLinecap="round" />

        {/* Tick marks */}
        {[0, 10, 15, 20, 25, 50, 75, 100].map((tick) => {
          const tAngle = 180 - tick * 1.8;
          const tRad = (tAngle * Math.PI) / 180;
          const inner = 62;
          const outer = 78;
          return (
            <line
              key={tick}
              x1={cx + inner * Math.cos(tRad)}
              y1={cy + inner * Math.sin(tRad)}
              x2={cx + outer * Math.cos(tRad)}
              y2={cy + outer * Math.sin(tRad)}
              stroke="#2A3550"
              strokeWidth="2"
            />
          );
        })}

        {/* Green zone 15-100 background */}
        {(() => {
          const gStart = 180 - 15 * 1.8;
          const gEnd = 180 - 100 * 1.8;
          const gsRad = (gStart * Math.PI) / 180;
          const geRad = (gEnd * Math.PI) / 180;
          const gPath = `M ${cx + r * Math.cos(gsRad)} ${cy + r * Math.sin(gsRad)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(geRad)} ${cy + r * Math.sin(geRad)}`;
          return <path d={gPath} fill="none" stroke="rgba(0,198,80,0.1)" strokeWidth="14" strokeLinecap="butt" />;
        })()}

        {/* Colored fill arc */}
        {arcPath && (
          <path d={arcPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx2}
          y2={ny2}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="#040810" />

        {/* Labels */}
        <text x="14" y="108" fill="#8B95A5" fontSize="9" textAnchor="middle">0%</text>
        <text x="186" y="108" fill="#8B95A5" fontSize="9" textAnchor="middle">100%</text>
        <text x="100" y="22" fill="#8B95A5" fontSize="9" textAnchor="middle">50%</text>

        {/* Zone labels */}
        <text x="38" y="76" fill="#FF4444" fontSize="7.5" textAnchor="middle">LOW</text>
        <text x="100" y="46" fill="#FFAA00" fontSize="7.5" textAnchor="middle">OK</text>
        <text x="162" y="76" fill="#00C650" fontSize="7.5" textAnchor="middle">GOOD</text>
      </svg>

      {/* Big number */}
      <div className="mt-2 text-center">
        <div className="text-5xl font-bold tracking-tight" style={{ color }}>
          {label}
        </div>
        <div className="text-xl font-semibold mt-1" style={{ color }}>
          {marginLabel}
        </div>
        {revenue > 0 && (
          <div className="text-sm text-warp-muted mt-1">
            on{' '}
            {revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
            revenue
          </div>
        )}
      </div>
    </div>
  );
}
