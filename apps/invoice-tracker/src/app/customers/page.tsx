export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { customers } from '@/db/schema';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CustomerStatusBadge } from '@/components/CustomerStatusBadge';
import { PaymentTermsBadge } from '@/components/PaymentTermsBadge';
import { SortHeader } from '@/components/SortHeader';
import { Pagination } from '@/components/Pagination';
import { CustomerSearch } from './CustomerSearch';

const PAGE_SIZE = 25;

type SortBy = 'name' | 'paymentTerms' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

function buildSortHref(
  current: URLSearchParams,
  col: SortBy,
  currentSortBy: SortBy,
  currentSortDir: SortDir
): string {
  const p = new URLSearchParams(current.toString());
  p.set('sortBy', col);
  p.set('sortDir', currentSortBy === col && currentSortDir === 'asc' ? 'desc' : 'asc');
  p.delete('page');
  return `/customers?${p.toString()}`;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentTerms?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search;
  const status = params.status;
  const paymentTerms = params.paymentTerms;
  const sortBy = (params.sortBy as SortBy) || 'name';
  const sortDir = (params.sortDir as SortDir) || 'asc';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const allCustomers = await db.select().from(customers);

  // Filter
  let filtered = allCustomers;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.billingContact?.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((c) => c.status === status);
  }

  if (paymentTerms && paymentTerms !== 'all') {
    filtered = filtered.filter((c) => c.paymentTerms === paymentTerms);
  }

  // Sort
  const mult = sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name': return mult * a.name.localeCompare(b.name);
      case 'paymentTerms': return mult * a.paymentTerms.localeCompare(b.paymentTerms);
      case 'status': return mult * a.status.localeCompare(b.status);
      case 'createdAt': return mult * a.createdAt.localeCompare(b.createdAt);
      default: return 0;
    }
  });

  // Paginate
  const total = filtered.length;
  const pageCustomers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const qp = new URLSearchParams();
  if (search) qp.set('search', search);
  if (status) qp.set('status', status);
  if (paymentTerms) qp.set('paymentTerms', paymentTerms);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">
            {total} customer{total !== 1 ? 's' : ''}{total !== allCustomers.length ? ` of ${allCustomers.length} total` : ' total'}
          </p>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      {/* Search + Filters */}
      <CustomerSearch
        initialSearch={search}
        initialStatus={status}
        initialPaymentTerms={paymentTerms}
      />

      {/* Table */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <SortHeader
                href={buildSortHref(qp, 'name', sortBy, sortDir)}
                label="Customer"
                isActive={sortBy === 'name'}
                dir={sortDir}
              />
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Contact
              </th>
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Email
              </th>
              <SortHeader
                href={buildSortHref(qp, 'paymentTerms', sortBy, sortDir)}
                label="Terms"
                isActive={sortBy === 'paymentTerms'}
                dir={sortDir}
              />
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Total Invoiced
              </th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-4 py-3">
                Outstanding
              </th>
              <SortHeader
                href={buildSortHref(qp, 'status', sortBy, sortDir)}
                label="Status"
                isActive={sortBy === 'status'}
                dir={sortDir}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {pageCustomers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-[#8B95A5] py-12 text-sm">
                  No customers match your filters.{' '}
                  <Link href="/customers" className="text-[#00C650] underline">
                    Clear filters →
                  </Link>
                </td>
              </tr>
            )}
            {pageCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-[#0C1528] transition-colors group cursor-pointer"
              >
                <td className="px-4 py-3.5">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <div className="text-sm font-medium text-white group-hover:text-[#00C650] transition-colors">
                      {customer.name}
                    </div>
                    {customer.phone && (
                      <div className="text-xs text-[#8B95A5] mt-0.5">{customer.phone}</div>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <span className="text-sm text-[#8B95A5]">{customer.billingContact ?? '—'}</span>
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <span className="text-sm text-[#8B95A5]">{customer.email ?? '—'}</span>
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <PaymentTermsBadge terms={customer.paymentTerms} />
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <span className="text-sm text-[#8B95A5]">$0.00</span>
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <span className="text-sm text-[#8B95A5]">$0.00</span>
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <CustomerStatusBadge status={customer.status} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
