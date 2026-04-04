import { formatCurrency } from '@/lib/utils';
import type { PayType } from '@/db/schema';

interface PayCalculatorDisplayProps {
  payType: PayType;
  payRate: number;
  miles?: number | null;
  revenue?: number | null;
  hours?: number | null;
  stops?: number | null;
  payAmount: number;
}

export function PayCalculatorDisplay({
  payType,
  payRate,
  miles,
  revenue,
  hours,
  stops,
  payAmount,
}: PayCalculatorDisplayProps) {
  function buildFormula(): string {
    switch (payType) {
      case 'per_mile':
        return `$${payRate}/mi × ${miles ?? 0} mi = ${formatCurrency(payAmount)}`;
      case 'percentage':
        return `${payRate}% × ${formatCurrency(revenue ?? 0)} = ${formatCurrency(payAmount)}`;
      case 'flat':
        return `Flat rate = ${formatCurrency(payAmount)}`;
      case 'hourly':
        return `$${payRate}/hr × ${hours ?? 0} hrs = ${formatCurrency(payAmount)}`;
      case 'per_stop':
        return `$${payRate}/stop × ${stops ?? 0} stops = ${formatCurrency(payAmount)}`;
      default:
        return formatCurrency(payAmount);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 px-3 py-2 text-sm">
      <span className="text-[#00C650] font-mono">{buildFormula()}</span>
    </div>
  );
}
