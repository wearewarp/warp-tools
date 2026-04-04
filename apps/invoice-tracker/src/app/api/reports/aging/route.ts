import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, carrierPayments, customers } from '@/db/schema';

type AgingBucket = 'current' | 'days1to30' | 'days31to60' | 'days61to90' | 'days90plus';

function getAgingBucket(dueDate: string | null | undefined): AgingBucket {
  if (!dueDate) return 'current';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'current';
  if (days <= 30) return 'days1to30';
  if (days <= 60) return 'days31to60';
  if (days <= 90) return 'days61to90';
  return 'days90plus';
}

export async function GET() {
  const [allInvoices, allCustomers, allPayments] = await Promise.all([
    db.select().from(invoices),
    db.select().from(customers),
    db.select().from(carrierPayments),
  ]);

  const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

  // ─── Receivables Aging ───────────────────────────────────────────────────────
  // Only include invoices with outstanding balance (not void, not fully paid)
  const openInvoices = allInvoices.filter(
    (inv) => inv.status !== 'void' && inv.status !== 'paid' && (inv.total - inv.amountPaid) > 0
  );

  // Group by customer
  const receivablesMap = new Map<string, {
    customerName: string;
    customerId: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  }>();

  for (const inv of openInvoices) {
    const outstanding = inv.total - inv.amountPaid;
    const bucket = getAgingBucket(inv.dueDate);
    const customer = customerMap.get(inv.customerId);
    const customerName = customer?.name ?? 'Unknown';

    if (!receivablesMap.has(inv.customerId)) {
      receivablesMap.set(inv.customerId, {
        customerName,
        customerId: inv.customerId,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
      });
    }

    const row = receivablesMap.get(inv.customerId)!;
    row[bucket] += outstanding;
  }

  const receivablesAging = Array.from(receivablesMap.values()).map((row) => ({
    ...row,
    total: row.current + row.days1to30 + row.days31to60 + row.days61to90 + row.days90plus,
  })).sort((a, b) => b.total - a.total);

  // ─── Payables Aging ──────────────────────────────────────────────────────────
  // Only include payments that are not yet paid: pending or approved
  const openPayments = allPayments.filter(
    (p) => p.status !== 'paid'
  );

  // Group by carrier (by carrierId if available, else carrierName)
  const payablesMap = new Map<string, {
    carrierName: string;
    carrierId: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
  }>();

  for (const p of openPayments) {
    const key = p.carrierId ?? p.carrierName;
    const bucket = getAgingBucket(p.scheduledDate);

    if (!payablesMap.has(key)) {
      payablesMap.set(key, {
        carrierName: p.carrierName,
        carrierId: key,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
      });
    }

    const row = payablesMap.get(key)!;
    row[bucket] += p.netAmount;
  }

  const payablesAging = Array.from(payablesMap.values()).map((row) => ({
    ...row,
    total: row.current + row.days1to30 + row.days31to60 + row.days61to90 + row.days90plus,
  })).sort((a, b) => b.total - a.total);

  // ─── Totals ──────────────────────────────────────────────────────────────────
  type AnyAgingRow = { current: number; days1to30: number; days31to60: number; days61to90: number; days90plus: number; total: number; [key: string]: unknown };
  function sumBuckets(rows: AnyAgingRow[]) {
    return rows.reduce(
      (acc, row) => {
        acc.current += row.current;
        acc.days1to30 += row.days1to30;
        acc.days31to60 += row.days31to60;
        acc.days61to90 += row.days61to90;
        acc.days90plus += row.days90plus;
        acc.total += row.total;
        return acc;
      },
      { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 0 }
    );
  }

  const receivablesTotals = sumBuckets(receivablesAging);
  const payablesTotals = sumBuckets(payablesAging);

  return NextResponse.json({
    receivablesAging,
    payablesAging,
    receivablesTotals,
    payablesTotals,
  });
}
