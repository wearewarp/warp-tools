'use client';

import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export interface AgingRow {
  name: string;
  id: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface AgingTotals {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

interface AgingTableProps {
  rows: AgingRow[];
  totals: AgingTotals;
  type: 'receivables' | 'payables';
  nameLabel?: string;
}

const BUCKET_COLORS = {
  current: 'text-[#00C650]',
  days1to30: 'text-[#FFDD57]',
  days31to60: 'text-[#FFAA00]',
  days61to90: 'text-[#FF6B35]',
  days90plus: 'text-[#FF4444]',
};

const BUCKET_BG = {
  current: 'bg-[#00C650]/5',
  days1to30: 'bg-[#FFDD57]/5',
  days31to60: 'bg-[#FFAA00]/5',
  days61to90: 'bg-[#FF6B35]/5',
  days90plus: 'bg-[#FF4444]/5',
};

function AmountCell({
  amount,
  colorClass,
  bgClass,
  onClick,
}: {
  amount: number;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
}) {
  if (amount === 0) {
    return (
      <td className="px-4 py-3 text-right text-sm text-[#2A3347]">—</td>
    );
  }
  return (
    <td className={`px-4 py-3 text-right text-sm font-medium ${colorClass} ${bgClass}`}>
      <button
        onClick={onClick}
        className="hover:underline cursor-pointer transition-opacity hover:opacity-80"
      >
        {formatCurrency(amount)}
      </button>
    </td>
  );
}

export function AgingTable({ rows, totals, type, nameLabel = 'Name' }: AgingTableProps) {
  const router = useRouter();

  function navTo(id: string, bucket?: string) {
    if (type === 'receivables') {
      const params = new URLSearchParams({ customer: id });
      if (bucket) params.set('aging', bucket);
      router.push(`/invoices?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ carrier: id });
      if (bucket) params.set('aging', bucket);
      router.push(`/payments?${params.toString()}`);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1A2235]">
            <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3 w-48">
              {nameLabel}
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wide px-4 py-3 ${BUCKET_COLORS.current}`}>
              Current
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wide px-4 py-3 ${BUCKET_COLORS.days1to30}`}>
              1–30 days
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wide px-4 py-3 ${BUCKET_COLORS.days31to60}`}>
              31–60 days
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wide px-4 py-3 ${BUCKET_COLORS.days61to90}`}>
              61–90 days
            </th>
            <th className={`text-right text-xs font-semibold uppercase tracking-wide px-4 py-3 ${BUCKET_COLORS.days90plus}`}>
              90+ days
            </th>
            <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A2235]">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-[#8B95A5] py-10 text-sm italic">
                No data available.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#0C1528]/50 transition-colors">
              <td className="px-4 py-3">
                <button
                  onClick={() => navTo(row.id)}
                  className="text-white hover:text-[#00C650] transition-colors font-medium text-left"
                >
                  {row.name}
                </button>
              </td>
              <AmountCell
                amount={row.current}
                colorClass={BUCKET_COLORS.current}
                bgClass={BUCKET_BG.current}
                onClick={() => navTo(row.id, 'current')}
              />
              <AmountCell
                amount={row.days1to30}
                colorClass={BUCKET_COLORS.days1to30}
                bgClass={BUCKET_BG.days1to30}
                onClick={() => navTo(row.id, '1-30')}
              />
              <AmountCell
                amount={row.days31to60}
                colorClass={BUCKET_COLORS.days31to60}
                bgClass={BUCKET_BG.days31to60}
                onClick={() => navTo(row.id, '31-60')}
              />
              <AmountCell
                amount={row.days61to90}
                colorClass={BUCKET_COLORS.days61to90}
                bgClass={BUCKET_BG.days61to90}
                onClick={() => navTo(row.id, '61-90')}
              />
              <AmountCell
                amount={row.days90plus}
                colorClass={BUCKET_COLORS.days90plus}
                bgClass={BUCKET_BG.days90plus}
                onClick={() => navTo(row.id, '90+')}
              />
              <td className="px-4 py-3 text-right text-sm font-semibold text-white">
                {formatCurrency(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#2A3347] bg-[#080F1E]">
            <td className="px-4 py-3 text-xs font-bold text-[#8B95A5] uppercase tracking-wide">
              Total
            </td>
            <td className={`px-4 py-3 text-right text-sm font-bold ${BUCKET_COLORS.current}`}>
              {totals.current > 0 ? formatCurrency(totals.current) : '—'}
            </td>
            <td className={`px-4 py-3 text-right text-sm font-bold ${BUCKET_COLORS.days1to30}`}>
              {totals.days1to30 > 0 ? formatCurrency(totals.days1to30) : '—'}
            </td>
            <td className={`px-4 py-3 text-right text-sm font-bold ${BUCKET_COLORS.days31to60}`}>
              {totals.days31to60 > 0 ? formatCurrency(totals.days31to60) : '—'}
            </td>
            <td className={`px-4 py-3 text-right text-sm font-bold ${BUCKET_COLORS.days61to90}`}>
              {totals.days61to90 > 0 ? formatCurrency(totals.days61to90) : '—'}
            </td>
            <td className={`px-4 py-3 text-right text-sm font-bold ${BUCKET_COLORS.days90plus}`}>
              {totals.days90plus > 0 ? formatCurrency(totals.days90plus) : '—'}
            </td>
            <td className="px-4 py-3 text-right text-sm font-bold text-white">
              {formatCurrency(totals.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
