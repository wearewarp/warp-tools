export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { PaymentsClient } from './PaymentsClient';

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

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    payType?: string;
    carrier?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDir?: string;
    page?: string;
  }>;
}

export default async function CarrierPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search;
  const statusFilter = params.status;
  const payTypeFilter = params.payType;
  const carrierFilter = params.carrier;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const sortBy = (params.sortBy as SortBy) || 'createdAt';
  const sortDir = (params.sortDir as SortDir) || 'desc';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  let all = await db.select().from(carrierPayments);

  // Build unique carrier list for filter dropdown
  const carrierList = [...new Set(all.map((p) => p.carrierName))].sort();

  // Filter
  if (search) {
    const q = search.toLowerCase();
    all = all.filter(
      (p) =>
        p.carrierName.toLowerCase().includes(q) ||
        (p.loadRef ?? '').toLowerCase().includes(q) ||
        (p.referenceNumber ?? '').toLowerCase().includes(q)
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    all = all.filter((p) => p.status === statusFilter);
  }

  if (payTypeFilter && payTypeFilter !== 'all') {
    all = all.filter((p) => p.payType === payTypeFilter);
  }

  if (carrierFilter) {
    const q = carrierFilter.toLowerCase();
    all = all.filter((p) => p.carrierName.toLowerCase().includes(q));
  }

  if (dateFrom) {
    all = all.filter((p) => p.scheduledDate && p.scheduledDate >= dateFrom);
  }

  if (dateTo) {
    all = all.filter((p) => p.scheduledDate && p.scheduledDate <= dateTo);
  }

  // Sort
  const mult = sortDir === 'asc' ? 1 : -1;
  all.sort((a, b) => {
    switch (sortBy) {
      case 'carrierName': return mult * a.carrierName.localeCompare(b.carrierName);
      case 'loadRef': return mult * (a.loadRef ?? '').localeCompare(b.loadRef ?? '');
      case 'amount': return mult * (a.amount - b.amount);
      case 'netAmount': return mult * (a.netAmount - b.netAmount);
      case 'payType': return mult * a.payType.localeCompare(b.payType);
      case 'status': return mult * a.status.localeCompare(b.status);
      case 'scheduledDate': return mult * (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? '');
      case 'paidDate': return mult * (a.paidDate ?? '').localeCompare(b.paidDate ?? '');
      default: return mult * a.createdAt.localeCompare(b.createdAt);
    }
  });

  const total = all.length;
  const paginated = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PaymentsClient
      payments={paginated}
      total={total}
      page={page}
      sortBy={sortBy}
      sortDir={sortDir}
      searchParams={params as Record<string, string | undefined>}
      carrierList={carrierList}
    />
  );
}
