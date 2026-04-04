'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, CheckSquare, Square, Minus } from 'lucide-react';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';
import { PayTypeBadge } from '@/components/PayTypeBadge';
import { Pagination } from '@/components/Pagination';
import { SortHeader } from '@/components/SortHeader';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CarrierPayment } from '@/db/schema';

const PAGE_SIZE = 25;

type SortBy =
  | 'carrierName'
  | 'loadRef'
  | 'amount'
  | 'netAmount'
  | 'payType'
  | 'status'
  | 'scheduledDate'
  | 'paidDate'
  | 'createdAt';
type SortDir = 'asc' | 'desc';

interface PaymentsClientProps {
  payments: CarrierPayment[];
  total: number;
  page: number;
  sortBy: SortBy;
  sortDir: SortDir;
  searchParams: Record<string, string | undefined>;
  carrierList: string[];
}

function buildHref(
  params: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const merged = { ...params, ...overrides };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== '') p.set(k, v);
  }
  return `/payments?${p.toString()}`;
}

function buildSortHref(
  params: Record<string, string | undefined>,
  col: SortBy,
  currentSort: SortBy,
  currentDir: SortDir
): string {
  return buildHref(params, {
    sortBy: col,
    sortDir: currentSort === col && currentDir === 'asc' ? 'desc' : 'asc',
    page: undefined,
  });
}

export function PaymentsClient({
  payments,
  total,
  page,
  sortBy,
  sortDir,
  searchParams,
  carrierList,
}: PaymentsClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRef, setBulkRef] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  // Search/filter state (controlled, debounced via router)
  const [localSearch, setLocalSearch] = useState(searchParams.search ?? '');

  function navigate(overrides: Record<string, string | undefined>) {
    startTransition(() => router.push(buildHref(searchParams, overrides)));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: localSearch || undefined, page: undefined });
  }

  // Selection helpers
  const allIds = payments.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedIds = Array.from(selected);
  const selectedCount = selectedIds.length;

  async function handleBulkMarkPaid() {
    setBulkLoading(true);
    try {
      const res = await fetch('/api/carrier-payments/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          status: 'paid',
          paidDate: bulkDate,
          referenceNumber: bulkRef || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast({ message: `${selectedCount} payment${selectedCount !== 1 ? 's' : ''} marked as paid`, type: 'success' });
      setSelected(new Set());
      setShowBulkModal(false);
      setBulkRef('');
      router.refresh();
    } catch {
      toast({ message: 'Failed to update payments', type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  }

  const inputClass =
    'px-3 py-2 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Carrier Payments</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">
            {total} payment{total !== 1 ? 's' : ''}
            {selectedCount > 0 && (
              <span className="text-[#00C650] ml-2">· {selectedCount} selected</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              Mark as Paid ({selectedCount})
            </button>
          )}
          <Link
            href="/payments/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Payment
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search carrier, load ref, reference #..."
            className={`${inputClass} pl-9 w-full`}
          />
        </div>

        <select
          value={searchParams.status ?? 'all'}
          onChange={(e) => navigate({ status: e.target.value === 'all' ? undefined : e.target.value, page: undefined })}
          className={inputClass}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="disputed">Disputed</option>
        </select>

        <select
          value={searchParams.payType ?? 'all'}
          onChange={(e) => navigate({ payType: e.target.value === 'all' ? undefined : e.target.value, page: undefined })}
          className={inputClass}
        >
          <option value="all">All Pay Types</option>
          <option value="standard">Standard</option>
          <option value="quick_pay">Quick Pay</option>
          <option value="hold">Hold</option>
        </select>

        <select
          value={searchParams.carrier ?? ''}
          onChange={(e) => navigate({ carrier: e.target.value || undefined, page: undefined })}
          className={inputClass}
        >
          <option value="">All Carriers</option>
          {carrierList.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <input
          type="date"
          value={searchParams.dateFrom ?? ''}
          onChange={(e) => navigate({ dateFrom: e.target.value || undefined, page: undefined })}
          className={inputClass}
          title="Scheduled date from"
        />
        <input
          type="date"
          value={searchParams.dateTo ?? ''}
          onChange={(e) => navigate({ dateTo: e.target.value || undefined, page: undefined })}
          className={inputClass}
          title="Scheduled date to"
        />

        <button type="submit" className="px-4 py-2 bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] text-sm text-[#8B95A5] hover:text-white rounded-xl transition-colors">
          Search
        </button>

        {(searchParams.search || searchParams.status || searchParams.payType || searchParams.carrier || searchParams.dateFrom || searchParams.dateTo) && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              navigate({ search: undefined, status: undefined, payType: undefined, carrier: undefined, dateFrom: undefined, dateTo: undefined, page: undefined });
            }}
            className="px-3 py-2 text-xs text-[#8B95A5] hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll} className="text-[#8B95A5] hover:text-white transition-colors">
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-[#00C650]" />
                  ) : someSelected ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <SortHeader
                href={buildSortHref(searchParams, 'carrierName', sortBy, sortDir)}
                label="Carrier"
                isActive={sortBy === 'carrierName'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(searchParams, 'loadRef', sortBy, sortDir)}
                label="Load Ref"
                isActive={sortBy === 'loadRef'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(searchParams, 'amount', sortBy, sortDir)}
                label="Amount"
                isActive={sortBy === 'amount'}
                dir={sortDir}
                align="right"
              />
              <SortHeader
                href={buildSortHref(searchParams, 'netAmount', sortBy, sortDir)}
                label="Net Amount"
                isActive={sortBy === 'netAmount'}
                dir={sortDir}
                align="right"
              />
              <SortHeader
                href={buildSortHref(searchParams, 'payType', sortBy, sortDir)}
                label="Pay Type"
                isActive={sortBy === 'payType'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(searchParams, 'status', sortBy, sortDir)}
                label="Status"
                isActive={sortBy === 'status'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(searchParams, 'scheduledDate', sortBy, sortDir)}
                label="Scheduled"
                isActive={sortBy === 'scheduledDate'}
                dir={sortDir}
              />
              <SortHeader
                href={buildSortHref(searchParams, 'paidDate', sortBy, sortDir)}
                label="Paid Date"
                isActive={sortBy === 'paidDate'}
                dir={sortDir}
              />
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Ref #
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {payments.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-[#8B95A5] py-12 text-sm">
                  No payments match your filters.{' '}
                  <Link href="/payments" className="text-[#00C650] underline">
                    Clear filters →
                  </Link>
                </td>
              </tr>
            )}
            {payments.map((payment) => {
              const isSelected = selected.has(payment.id);
              return (
                <tr
                  key={payment.id}
                  className={`hover:bg-[#0C1528] transition-colors group ${isSelected ? 'bg-[#00C650]/5' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleOne(payment.id)}
                      className="text-[#8B95A5] hover:text-white transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#00C650]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <div className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors">
                        {payment.carrierName}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className="text-sm text-[#8B95A5] font-mono">{payment.loadRef ?? '—'}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className="text-sm text-white font-medium">{formatCurrency(payment.amount)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className={`text-sm font-medium ${payment.payType === 'quick_pay' ? 'text-[#00C650]' : 'text-[#8B95A5]'}`}>
                        {formatCurrency(payment.netAmount)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <PayTypeBadge payType={payment.payType} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <PaymentStatusBadge status={payment.status} />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{formatDate(payment.scheduledDate)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className="text-sm text-[#8B95A5]">{formatDate(payment.paidDate)}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/payments/${payment.id}`} className="block">
                      <span className="text-sm text-[#8B95A5] font-mono">{payment.referenceNumber || '—'}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />

      {/* Bulk Mark Paid Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Mark as Paid</h2>
            <p className="text-sm text-[#8B95A5] mb-5">
              Marking {selectedCount} payment{selectedCount !== 1 ? 's' : ''} as paid.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Paid Date
                </label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white focus:outline-none focus:border-[#00C650]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Reference # <span className="text-[#8B95A5]/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={bulkRef}
                  onChange={(e) => setBulkRef(e.target.value)}
                  placeholder="ACH-00123 or CHK-456"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkMarkPaid}
                disabled={bulkLoading}
                className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
              >
                {bulkLoading ? 'Updating...' : `Mark ${selectedCount} as Paid`}
              </button>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
