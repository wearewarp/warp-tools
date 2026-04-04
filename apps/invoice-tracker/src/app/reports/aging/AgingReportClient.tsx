'use client';

import { Printer, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { AgingTable, AgingRow, AgingTotals } from '@/components/AgingTable';
import { formatCurrency } from '@/lib/utils';

interface AgingReportClientProps {
  receivablesAging: AgingRow[];
  payablesAging: AgingRow[];
  receivablesTotals: AgingTotals;
  payablesTotals: AgingTotals;
  totalOverdue: number;
}

export function AgingReportClient({
  receivablesAging,
  payablesAging,
  receivablesTotals,
  payablesTotals,
  totalOverdue,
}: AgingReportClientProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; }
        }
      `}</style>

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-2xl font-bold text-white">Aging Report</h1>
            <p className="text-[#8B95A5] text-sm mt-0.5">
              Receivables &amp; payables by age bucket — as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] text-sm text-[#8B95A5] hover:text-white rounded-xl transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 no-print">
          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[#00C650]" />
              <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Receivables</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(receivablesTotals.total)}</div>
            <div className="text-xs text-[#8B95A5] mt-1">
              {receivablesAging.length} customer{receivablesAging.length !== 1 ? 's' : ''} with open balances
            </div>
          </div>

          <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-[#4B8EE8]" />
              <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Payables</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">{formatCurrency(payablesTotals.total)}</div>
            <div className="text-xs text-[#8B95A5] mt-1">
              {payablesAging.length} carrier{payablesAging.length !== 1 ? 's' : ''} with unpaid amounts
            </div>
          </div>

          <div className="rounded-2xl bg-[#080F1E] border border-[#FF4444]/20 p-5">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-[#FF4444]" />
              <span className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Total Overdue</span>
            </div>
            <div className={`text-2xl font-bold mt-1 ${totalOverdue > 0 ? 'text-[#FF4444]' : 'text-white'}`}>
              {formatCurrency(totalOverdue)}
            </div>
            <div className="text-xs text-[#8B95A5] mt-1">
              Receivables past due date
            </div>
          </div>
        </div>

        {/* Receivables Aging */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden mb-6 print-section">
          <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Receivables Aging</h2>
              <p className="text-xs text-[#8B95A5] mt-0.5">Outstanding invoices by customer</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8B95A5]">Total Outstanding</div>
              <div className="text-lg font-bold text-white">{formatCurrency(receivablesTotals.total)}</div>
            </div>
          </div>
          <AgingTable
            rows={receivablesAging}
            totals={receivablesTotals}
            type="receivables"
            nameLabel="Customer"
          />
        </div>

        {/* Payables Aging */}
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden print-section">
          <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Payables Aging</h2>
              <p className="text-xs text-[#8B95A5] mt-0.5">Unpaid carrier payments</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8B95A5]">Total Outstanding</div>
              <div className="text-lg font-bold text-white">{formatCurrency(payablesTotals.total)}</div>
            </div>
          </div>
          <AgingTable
            rows={payablesAging}
            totals={payablesTotals}
            type="payables"
            nameLabel="Carrier"
          />
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 items-center text-xs text-[#8B95A5] no-print">
          <span className="font-medium">Color guide:</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00C650]" />Current</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FFDD57]" />1–30 days</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FFAA00]" />31–60 days</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />61–90 days</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#FF4444]" />90+ days</span>
          <span className="ml-auto text-[#8B95A5]/60">Click any amount to view filtered details</span>
        </div>
      </div>
    </>
  );
}
