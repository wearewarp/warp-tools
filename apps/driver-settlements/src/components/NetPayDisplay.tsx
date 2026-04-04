import { formatCurrency } from '@/lib/utils';

interface NetPayDisplayProps {
  gross: number;
  totalDeductions: number;
  totalAdvances: number;
  totalReimbursements: number;
  netPay: number;
}

export function NetPayDisplay({
  gross,
  totalDeductions,
  totalAdvances,
  totalReimbursements,
  netPay,
}: NetPayDisplayProps) {
  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#00C650]/30 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-sm text-[#8B95A5] mb-3 font-medium">Net Pay Calculation</div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="font-semibold text-white">{formatCurrency(gross)}</span>
            <span className="text-[#8B95A5]">gross</span>
            {totalDeductions > 0 && (
              <>
                <span className="text-[#8B95A5]">−</span>
                <span className="font-semibold text-red-400">{formatCurrency(totalDeductions)}</span>
                <span className="text-[#8B95A5]">deductions</span>
              </>
            )}
            {totalAdvances > 0 && (
              <>
                <span className="text-[#8B95A5]">−</span>
                <span className="font-semibold text-orange-400">{formatCurrency(totalAdvances)}</span>
                <span className="text-[#8B95A5]">advances</span>
              </>
            )}
            {totalReimbursements > 0 && (
              <>
                <span className="text-[#8B95A5]">+</span>
                <span className="font-semibold text-blue-400">{formatCurrency(totalReimbursements)}</span>
                <span className="text-[#8B95A5]">reimbursements</span>
              </>
            )}
            <span className="text-[#8B95A5]">=</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Net Pay</div>
          <div className={`text-4xl font-bold tabular-nums ${netPay >= 0 ? 'text-[#00C650]' : 'text-red-400'}`}>
            {formatCurrency(netPay)}
          </div>
        </div>
      </div>
    </div>
  );
}
