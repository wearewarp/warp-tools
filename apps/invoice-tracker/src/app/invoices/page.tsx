export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { invoices, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { SortHeader } from '@/components/SortHeader';
import { Pagination } from '@/components/Pagination';
import { InvoiceSearch } from './InvoiceSearch';
import { InvoiceListClient } from './InvoiceListClient';
import { formatCurrency, formatDate } from '@/lib/utils';

const PAGE_SIZE = 25;

type SortBy = 'invoiceNumber' | 'customerName' | 'invoiceDate' | 'dueDate' | 'total' | 'balanceDue' | 'status';
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
  return `/invoices?${p.toString()}`;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    customerId?: string;
    agingBucket?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search;
  const statusFilter = params.status;
  const customerIdFilter = params.customerId;
  const agingBucket = params.agingBucket;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const sortBy = (params.sortBy as SortBy) || 'invoiceDate';
  const sortDir = (params.sortDir as SortDir) || 'desc';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  // Fetch all data
  const allCustomers = await db.select({ id: customers.id, name: customers.name }).from(customers);

  const rows = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type Row = {
    invoice: typeof rows[0]['invoice'];
    customerName: string | null;
    effectiveStatus: string;
    balanceDue: number;
    daysOverdue: number;
  };

  let results: Row[] = rows.map((row) => {
    const inv = row.invoice;
    let effectiveStatus = inv.status;
    if (inv.status === 'sent') {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) effectiveStatus = 'overdue';
    }
    const balanceDue = inv.total - inv.amountPaid;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysOverdue = due < today ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
    return { ...row, effectiveStatus, balanceDue, daysOverdue };
  });

  // Filter
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.invoice.invoiceNumber.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.invoice.loadRef?.toLowerCase().includes(q)
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    results = results.filter((r) => r.effectiveStatus === statusFilter);
  }

  if (customerIdFilter && customerIdFilter !== 'all') {
    results = results.filter((r) => r.invoice.customerId === customerIdFilter);
  }

  if (dateFrom) {
    results = results.filter((r) => r.invoice.invoiceDate >= dateFrom);
  }
  if (dateTo) {
    results = results.filter((r) => r.invoice.invoiceDate <= dateTo);
  }

  if (agingBucket && agingBucket !== 'all') {
    results = results.filter((r) => {
      const days = r.daysOverdue;
      switch (agingBucket) {
        case 'current': return days === 0;
        case '1-30': return days >= 1 && days <= 30;
        case '31-60': return days >= 31 && days <= 60;
        case '61-90': return days >= 61 && days <= 90;
        case '90+': return days > 90;
        default: return true;
      }
    });
  }

  // Sort
  const mult = sortDir === 'asc' ? 1 : -1;
  results.sort((a, b) => {
    switch (sortBy) {
      case 'invoiceNumber': return mult * a.invoice.invoiceNumber.localeCompare(b.invoice.invoiceNumber);
      case 'customerName': return mult * (a.customerName ?? '').localeCompare(b.customerName ?? '');
      case 'invoiceDate': return mult * a.invoice.invoiceDate.localeCompare(b.invoice.invoiceDate);
      case 'dueDate': return mult * a.invoice.dueDate.localeCompare(b.invoice.dueDate);
      case 'total': return mult * (a.invoice.total - b.invoice.total);
      case 'balanceDue': return mult * (a.balanceDue - b.balanceDue);
      case 'status': return mult * a.effectiveStatus.localeCompare(b.effectiveStatus);
      default: return 0;
    }
  });

  const total = results.length;
  const pageData = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const qp = new URLSearchParams();
  if (search) qp.set('search', search);
  if (statusFilter) qp.set('status', statusFilter);
  if (customerIdFilter) qp.set('customerId', customerIdFilter);
  if (agingBucket) qp.set('agingBucket', agingBucket);
  if (dateFrom) qp.set('dateFrom', dateFrom);
  if (dateTo) qp.set('dateTo', dateTo);

  // Summary stats
  const totalOutstanding = rows.reduce((s, r) => {
    const es = r.invoice.status === 'sent' ? (() => {
      const due = new Date(r.invoice.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today ? 'overdue' : 'sent';
    })() : r.invoice.status;
    if (['sent', 'partially_paid', 'overdue'].includes(es)) {
      return s + (r.invoice.total - r.invoice.amountPaid);
    }
    return s;
  }, 0);

  const overdueCount = rows.filter((r) => {
    if (r.invoice.status !== 'sent') return false;
    const due = new Date(r.invoice.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-[#8B95A5] text-sm mt-0.5">
            {total} invoice{total !== 1 ? 's' : ''}{total !== rows.length ? ` of ${rows.length} total` : ' total'}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-400">· {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-[#8B95A5]">Outstanding</div>
            <div className="text-lg font-bold text-white">{formatCurrency(totalOutstanding)}</div>
          </div>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <InvoiceSearch
        customers={allCustomers}
        initialSearch={search}
        initialStatus={statusFilter}
        initialCustomerId={customerIdFilter}
        initialAgingBucket={agingBucket}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
      />

      {/* Table with client-side bulk select */}
      <InvoiceListClient
        rows={pageData.map((r) => ({
          id: r.invoice.id,
          invoiceNumber: r.invoice.invoiceNumber,
          customerId: r.invoice.customerId,
          customerName: r.customerName ?? '—',
          loadRef: r.invoice.loadRef,
          invoiceDate: r.invoice.invoiceDate,
          dueDate: r.invoice.dueDate,
          total: r.invoice.total,
          balanceDue: r.balanceDue,
          effectiveStatus: r.effectiveStatus,
          daysOverdue: r.daysOverdue,
        }))}
        sortBy={sortBy}
        sortDir={sortDir}
        sortHrefs={{
          invoiceNumber: buildSortHref(qp, 'invoiceNumber', sortBy, sortDir),
          customerName: buildSortHref(qp, 'customerName', sortBy, sortDir),
          invoiceDate: buildSortHref(qp, 'invoiceDate', sortBy, sortDir),
          dueDate: buildSortHref(qp, 'dueDate', sortBy, sortDir),
          total: buildSortHref(qp, 'total', sortBy, sortDir),
          balanceDue: buildSortHref(qp, 'balanceDue', sortBy, sortDir),
          status: buildSortHref(qp, 'status', sortBy, sortDir),
        }}
      />

      <Pagination total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
