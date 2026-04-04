'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { InvoiceBulkActions } from './InvoiceBulkActions';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  loadRef: string | null;
  invoiceDate: string;
  dueDate: string;
  total: number;
  balanceDue: number;
  effectiveStatus: string;
  daysOverdue: number;
}

interface InvoiceListClientProps {
  rows: InvoiceRow[];
  sortBy: string;
  sortDir: string;
  sortHrefs: Record<string, string>;
}

function SortTh({
  children,
  href,
  col,
  sortBy,
  sortDir,
  right,
}: {
  children: React.ReactNode;
  href: string;
  col: string;
  sortBy: string;
  sortDir: string;
  right?: boolean;
}) {
  const isActive = sortBy === col;
  return (
    <th className={`${right ? 'text-right' : 'text-left'} text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3`}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-white transition-colors ${isActive ? 'text-white' : ''}`}
      >
        {children}
        {isActive && (
          <span className="text-[#00C650]">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </Link>
    </th>
  );
}

export function InvoiceListClient({ rows, sortBy, sortDir, sortHrefs }: InvoiceListClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="mt-4">
      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="mb-3">
          <InvoiceBulkActions selectedIds={selectedIds} onClear={() => setSelectedIds([])} />
        </div>
      )}

      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="rounded accent-[#00C650] cursor-pointer"
                />
              </th>
              <SortTh href={sortHrefs.invoiceNumber} col="invoiceNumber" sortBy={sortBy} sortDir={sortDir}>
                Invoice #
              </SortTh>
              <SortTh href={sortHrefs.customerName} col="customerName" sortBy={sortBy} sortDir={sortDir}>
                Customer
              </SortTh>
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Load Ref
              </th>
              <SortTh href={sortHrefs.invoiceDate} col="invoiceDate" sortBy={sortBy} sortDir={sortDir}>
                Invoice Date
              </SortTh>
              <SortTh href={sortHrefs.dueDate} col="dueDate" sortBy={sortBy} sortDir={sortDir}>
                Due Date
              </SortTh>
              <SortTh href={sortHrefs.total} col="total" sortBy={sortBy} sortDir={sortDir} right>
                Total
              </SortTh>
              <SortTh href={sortHrefs.balanceDue} col="balanceDue" sortBy={sortBy} sortDir={sortDir} right>
                Balance Due
              </SortTh>
              <SortTh href={sortHrefs.status} col="status" sortBy={sortBy} sortDir={sortDir}>
                Status
              </SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-[#8B95A5] py-12 text-sm">
                  No invoices match your filters.{' '}
                  <Link href="/invoices" className="text-[#00C650] underline">
                    Clear filters →
                  </Link>
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const selected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className={`hover:bg-[#0C1528] transition-colors group ${selected ? 'bg-[#00C650]/5' : ''}`}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleOne(row.id)}
                      className="rounded accent-[#00C650] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className="text-sm font-mono font-medium text-[#00C650] group-hover:underline">
                        {row.invoiceNumber}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className="text-sm text-white">{row.customerName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className="text-sm text-[#8B95A5] font-mono">{row.loadRef ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{formatDate(row.invoiceDate)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className={`text-sm ${row.daysOverdue > 0 ? 'text-red-400' : 'text-[#8B95A5]'}`}>
                        {formatDate(row.dueDate)}
                        {row.daysOverdue > 0 && (
                          <span className="block text-xs text-red-400/70">{row.daysOverdue}d overdue</span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className="text-sm font-medium text-white">{formatCurrency(row.total)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <span className={`text-sm font-semibold ${row.balanceDue > 0 ? (row.effectiveStatus === 'overdue' ? 'text-red-400' : 'text-yellow-400') : 'text-[#8B95A5]'}`}>
                        {row.balanceDue > 0 ? formatCurrency(row.balanceDue) : '—'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/invoices/${row.id}`} className="block">
                      <InvoiceStatusBadge status={row.effectiveStatus} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
