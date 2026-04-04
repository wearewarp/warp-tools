'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface InvoiceSearchProps {
  customers: Customer[];
  initialSearch?: string;
  initialStatus?: string;
  initialCustomerId?: string;
  initialAgingBucket?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
}

const inputClass =
  'px-3 py-2 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/60 focus:outline-none focus:border-[#00C650]/50 transition-colors';

export function InvoiceSearch({
  customers,
  initialSearch,
  initialStatus,
  initialCustomerId,
  initialAgingBucket,
  initialDateFrom,
  initialDateTo,
}: InvoiceSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch ?? '');

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete('page');
      startTransition(() => router.push(`/invoices?${params.toString()}`));
    },
    [router, searchParams]
  );

  function handleSearch(val: string) {
    setSearch(val);
    push({ search: val || undefined });
  }

  function handleClear() {
    startTransition(() => router.push('/invoices'));
    setSearch('');
  }

  const hasFilters =
    initialSearch ||
    (initialStatus && initialStatus !== 'all') ||
    (initialCustomerId && initialCustomerId !== 'all') ||
    (initialAgingBucket && initialAgingBucket !== 'all') ||
    initialDateFrom ||
    initialDateTo;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
        <input
          type="text"
          placeholder="Search invoice #, customer, load ref..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={`${inputClass} w-full pl-9`}
        />
      </div>

      {/* Status filter */}
      <select
        value={initialStatus ?? 'all'}
        onChange={(e) => push({ status: e.target.value === 'all' ? undefined : e.target.value })}
        className={inputClass}
      >
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="partially_paid">Partial</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="void">Void</option>
      </select>

      {/* Customer filter */}
      <select
        value={initialCustomerId ?? 'all'}
        onChange={(e) => push({ customerId: e.target.value === 'all' ? undefined : e.target.value })}
        className={inputClass}
      >
        <option value="all">All Customers</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Aging bucket */}
      <select
        value={initialAgingBucket ?? 'all'}
        onChange={(e) => push({ agingBucket: e.target.value === 'all' ? undefined : e.target.value })}
        className={inputClass}
      >
        <option value="all">All Aging</option>
        <option value="current">Current</option>
        <option value="1-30">1–30 Days</option>
        <option value="31-60">31–60 Days</option>
        <option value="61-90">61–90 Days</option>
        <option value="90+">90+ Days</option>
      </select>

      {/* Date range */}
      <input
        type="date"
        value={initialDateFrom ?? ''}
        onChange={(e) => push({ dateFrom: e.target.value || undefined })}
        className={inputClass}
        title="Invoice date from"
      />
      <span className="text-[#8B95A5] text-sm">→</span>
      <input
        type="date"
        value={initialDateTo ?? ''}
        onChange={(e) => push({ dateTo: e.target.value || undefined })}
        className={inputClass}
        title="Invoice date to"
      />

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors border border-[#1A2235]"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
