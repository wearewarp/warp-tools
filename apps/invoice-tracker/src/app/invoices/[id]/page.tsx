export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { invoices, invoiceLineItems, paymentsReceived, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { InvoiceDetailClient } from './InvoiceDetailClient';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [row] = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      customerAddressStreet: customers.addressStreet,
      customerAddressCity: customers.addressCity,
      customerAddressState: customers.addressState,
      customerAddressZip: customers.addressZip,
      customerPaymentTerms: customers.paymentTerms,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, id));

  if (!row) notFound();

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));

  const payments = await db
    .select()
    .from(paymentsReceived)
    .where(eq(paymentsReceived.invoiceId, id));

  const addrParts = [
    row.customerAddressStreet,
    row.customerAddressCity,
    [row.customerAddressState, row.customerAddressZip].filter(Boolean).join(' '),
  ].filter(Boolean);
  const customerAddress = addrParts.length > 0 ? addrParts.join(', ') : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(row.invoice.dueDate);
  due.setHours(0, 0, 0, 0);
  let effectiveStatus = row.invoice.status;
  if (row.invoice.status === 'sent' && due < today) {
    effectiveStatus = 'overdue';
  }
  const balanceDue = row.invoice.total - row.invoice.amountPaid;

  const invoiceData = {
    ...row.invoice,
    effectiveStatus,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerAddress: customerAddress,
    customerPaymentTerms: row.customerPaymentTerms,
    lineItems,
    payments,
    balanceDue,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8B95A5] mb-6">
        <Link href="/invoices" className="hover:text-white transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Invoices
        </Link>
        <span>/</span>
        <span className="text-white font-mono">{row.invoice.invoiceNumber}</span>
      </div>

      {/* Invoice Header — feels like an actual invoice */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                {row.invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={effectiveStatus} />
            </div>
            {row.invoice.loadRef && (
              <div className="text-sm text-[#8B95A5] font-mono">Load Ref: {row.invoice.loadRef}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-0.5">Balance Due</div>
            <div className={`text-3xl font-bold ${balanceDue <= 0 ? 'text-[#00C650]' : effectiveStatus === 'overdue' ? 'text-red-400' : 'text-white'}`}>
              ${balanceDue > 0 ? balanceDue.toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#1A2235] pt-5">
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Bill To</div>
            {row.customerName ? (
              <Link href={`/customers/${row.invoice.customerId}`} className="text-sm font-semibold text-white hover:text-[#00C650] transition-colors">
                {row.customerName}
              </Link>
            ) : (
              <div className="text-sm text-[#8B95A5]">—</div>
            )}
            {row.customerEmail && (
              <div className="text-xs text-[#8B95A5] mt-0.5">{row.customerEmail}</div>
            )}
            {row.customerPhone && (
              <div className="text-xs text-[#8B95A5]">{row.customerPhone}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Invoice Date</div>
            <div className="text-sm font-medium text-white">{formatDate(row.invoice.invoiceDate)}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Due Date</div>
            <div className={`text-sm font-medium ${effectiveStatus === 'overdue' ? 'text-red-400' : 'text-white'}`}>
              {formatDate(row.invoice.dueDate)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Payment Terms</div>
            <div className="text-sm font-medium text-white">
              {row.customerPaymentTerms?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'}
            </div>
          </div>
        </div>

        {row.invoice.notes && (
          <div className="mt-4 pt-4 border-t border-[#1A2235]">
            <div className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1">Notes</div>
            <p className="text-sm text-[#8B95A5]">{row.invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Client-side interactive section */}
      <InvoiceDetailClient invoice={invoiceData} />
    </div>
  );
}
