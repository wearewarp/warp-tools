'use client';

import type { AdvancedResult } from '@/lib/calc';
import { fmt$ } from '@/lib/calc';

interface ProfitBreakdownProps {
  result: AdvancedResult;
  fuelCost: number;
  tollCost: number;
  driverPay: number;
  deadheadCost: number;
  accessorialCost: number;
  factoringFee: number;
}

interface BarItem {
  label: string;
  value: number;
  color: string;
  isSubtract?: boolean;
}

function WaterfallBar({ item, maxVal }: { item: BarItem; maxVal: number }) {
  const pct = maxVal > 0 ? Math.min(100, (Math.abs(item.value) / maxVal) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-right text-sm text-warp-muted shrink-0">{item.label}</div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 bg-warp-border rounded-full h-5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: pct + '%', backgroundColor: item.color }}
          />
        </div>
        <div
          className="w-24 text-right text-sm font-mono font-semibold shrink-0"
          style={{ color: item.color }}
        >
          {item.isSubtract ? '-' : ''}{fmt$(Math.abs(item.value))}
        </div>
      </div>
    </div>
  );
}

export default function ProfitBreakdown({
  result,
  fuelCost,
  tollCost,
  driverPay,
  deadheadCost,
  accessorialCost,
  factoringFee,
}: ProfitBreakdownProps) {
  const { revenue, cost, trueMargin } = result;
  const maxVal = revenue;

  const bars: BarItem[] = [
    { label: 'Revenue', value: revenue, color: '#00C650' },
    { label: 'Carrier Cost', value: cost, color: '#FF4444', isSubtract: true },
  ];

  if (fuelCost > 0) bars.push({ label: 'Fuel', value: fuelCost, color: '#FF6B6B', isSubtract: true });
  if (tollCost > 0) bars.push({ label: 'Tolls', value: tollCost, color: '#FF6B6B', isSubtract: true });
  if (driverPay > 0) bars.push({ label: 'Driver Pay', value: driverPay, color: '#FF6B6B', isSubtract: true });
  if (deadheadCost > 0) bars.push({ label: 'Deadhead', value: deadheadCost, color: '#FF6B6B', isSubtract: true });
  if (accessorialCost > 0) bars.push({ label: 'Accessorials', value: accessorialCost, color: '#FF6B6B', isSubtract: true });
  if (factoringFee > 0) bars.push({ label: 'Factoring Fee', value: factoringFee, color: '#FF6B6B', isSubtract: true });

  const trueColor = trueMargin >= 0 ? '#00C650' : '#FF4444';
  bars.push({ label: 'True Profit', value: trueMargin, color: trueColor });

  return (
    <div className="space-y-3">
      <div className="h-px bg-warp-border" />
      {bars.map((item) => (
        <WaterfallBar key={item.label} item={item} maxVal={maxVal} />
      ))}
      <div className="h-px bg-warp-border" />
      <div className="flex justify-between text-sm">
        <span className="text-warp-muted">True Margin</span>
        <span
          className="font-semibold"
          style={{ color: result.trueMarginPercent >= 15 ? '#00C650' : result.trueMarginPercent >= 10 ? '#FFAA00' : '#FF4444' }}
        >
          {result.trueMarginPercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
