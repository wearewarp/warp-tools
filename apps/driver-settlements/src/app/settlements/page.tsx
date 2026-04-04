export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { settlements, drivers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  formatCurrency,
  formatDate,
  getSettlementStatusLabel,
  getSettlementStatusColor,
  cn,
} from '@/lib/utils';
import { FileText, Plus } from 'lucide-react';

export default async function SettlementsPage() {
  const allSettlements = await db
    .select({
      id: settlements.id,
      settlement_number: settlements.settlement_number,
      status: settlements.status,
      period_start: settlements.period_start,
      period_end: settlements.period_end,
      gross_earnings: settlements.gross_earnings,
      total_deductions: settlements.total_deductions,
      total_reimbursements: settlements.total_reimbursements,
      total_advances: settlements.total_advances,
      net_pay: settlements.net_pay,
      paid_date: settlements.paid_date,
      payment_method: settlements.payment_method,
      driver_first: drivers.first_name,
      driver_last: drivers.last_name,
      pay_type: drivers.pay_type,
    })
    .from(settlements)
    .innerJoin(drivers, eq(settlements.driver_id, drivers.id))
    .orderBy(settlements.id);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settlements</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{allSettlements.length} settlements</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Settlement
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {allSettlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-10 w-10 text-[#1A2235]" />
            <p className="text-sm text-[#8B95A5]">No settlements yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Settlement #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Deductions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Net Pay</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {allSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-[#0C1528] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[#00C650]">{s.settlement_number}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {s.driver_first} {s.driver_last}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8B95A5]">
                      {formatDate(s.period_start)} – {formatDate(s.period_end)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right tabular-nums">
                      {formatCurrency(s.gross_earnings)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-400 text-right tabular-nums">
                      -{formatCurrency(s.total_deductions + s.total_advances)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white text-right tabular-nums">
                      {formatCurrency(s.net_pay)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        getSettlementStatusColor(s.status)
                      )}>
                        {getSettlementStatusLabel(s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {s.paid_date ? formatDate(s.paid_date) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
