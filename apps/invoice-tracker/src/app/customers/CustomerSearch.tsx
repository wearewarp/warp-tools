'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState } from 'react';
import { Search, X } from 'lucide-react';

interface CustomerSearchProps {
  initialSearch?: string;
  initialStatus?: string;
  initialPaymentTerms?: string;
}

const inputClass =
  'px-3 py-2 rounded-xl bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

export function CustomerSearch({
  initialSearch,
  initialStatus,
  initialPaymentTerms,
}: CustomerSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch ?? '');

  function update(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    p.delete('page');
    startTransition(() => router.push(`?${p.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update('search', search);
  }

  function clearAll() {
    setSearch('');
    startTransition(() => router.push('/customers'));
  }

  const hasFilters = !!(initialSearch || (initialStatus && initialStatus !== 'all') || (initialPaymentTerms && initialPaymentTerms !== 'all'));

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => update('search', search)}
          placeholder="Search by name or email…"
          className={`${inputClass} pl-9 w-full`}
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); update('search', ''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A5] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Status filter */}
      <select
        value={initialStatus ?? 'all'}
        onChange={(e) => update('status', e.target.value)}
        className={inputClass}
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="on_hold">On Hold</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Payment Terms filter */}
      <select
        value={initialPaymentTerms ?? 'all'}
        onChange={(e) => update('paymentTerms', e.target.value)}
        className={inputClass}
      >
        <option value="all">All Terms</option>
        <option value="net_15">Net 15</option>
        <option value="net_30">Net 30</option>
        <option value="net_45">Net 45</option>
        <option value="net_60">Net 60</option>
        <option value="quick_pay">Quick Pay</option>
        <option value="factored">Factored</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-[#8B95A5] hover:text-white underline underline-offset-2 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
