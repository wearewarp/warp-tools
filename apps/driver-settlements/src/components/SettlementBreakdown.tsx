import { formatCurrency } from '@/lib/utils';

interface SettlementBreakdownProps {
  gross: number;
  totalDeductions: number;
  totalAdvances: number;
  totalReimbursements: number;
  netPay: number;
}

export function SettlementBreakdown({
  gross,
  totalDeductions,
  totalAdvances,
  totalReimbursements,
  netPay,
}: SettlementBreakdownProps) {
  const maxVal = Math.max(gross, Math.abs(netPay), 1);

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
      <div className="text-sm font-semibold text-white">Pay Breakdown</div>

      {/* Gross */}
      <div>
        <div className="flex justify-between text-xs text-[#8B95A5] mb-1">
          <span>Gross Earnings</span>
          <span className="text-white font-semibold">{formatCurrency(gross)}</span>
        </div>
        <div className="h-2 rounded-full bg-[#1A2235] overflow-hidden">
          <div
            className="h-full rounded-full bg-white/60"
            style={{ width: `${Math.min(100, (gross / maxVal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Deductions */}
      {totalDeductions > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#8B95A5] mb-1">
            <span>Deductions</span>
            <span className="text-red-400 font-semibold">−{formatCurrency(totalDeductions)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#1A2235] overflow-hidden">
            <div
              className="h-full rounded-full bg-red-400/60"
              style={{ width: `${Math.min(100, (totalDeductions / maxVal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Advances */}
      {totalAdvances > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#8B95A5] mb-1">
            <span>Advance Deductions</span>
            <span className="text-orange-400 font-semibold">−{formatCurrency(totalAdvances)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#1A2235] overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400/60"
              style={{ width: `${Math.min(100, (totalAdvances / maxVal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Reimbursements */}
      {totalReimbursements > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#8B95A5] mb-1">
            <span>Reimbursements</span>
            <span className="text-blue-400 font-semibold">+{formatCurrency(totalReimbursements)}</span>
          </div>
          <div className="h-2 rounded-full bg-[#1A2235] overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400/60"
              style={{ width: `${Math.min(100, (totalReimbursements / maxVal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Divider + Net */}
      <div className="pt-2 border-t border-[#1A2235]">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Net Pay</span>
          <span className={`text-xl font-bold tabular-nums ${netPay >= 0 ? 'text-[#00C650]' : 'text-red-400'}`}>
            {formatCurrency(netPay)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#1A2235] overflow-hidden mt-2">
          <div
            className={`h-full rounded-full ${netPay >= 0 ? 'bg-[#00C650]/70' : 'bg-red-400/70'}`}
            style={{ width: `${Math.min(100, (Math.abs(netPay) / maxVal) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
