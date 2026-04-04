export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  ClipboardList,
  FileText,
  Truck,
  Pencil,
} from 'lucide-react';
import { CustomerStatusBadge } from '@/components/CustomerStatusBadge';
import { PaymentTermsBadge } from '@/components/PaymentTermsBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CustomerDetailTabs } from './CustomerDetailTabs';
import { DeleteCustomerButton } from './DeleteCustomerButton';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CustomerDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Back */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Customers
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-white">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
              {customer.billingContact && (
                <span className="flex items-center gap-1.5 text-sm text-[#8B95A5]">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  {customer.billingContact}
                </span>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-[#00C650] transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-[#00C650] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  {customer.phone}
                </a>
              )}
              {customer.address && (
                <span className="flex items-center gap-1.5 text-sm text-[#8B95A5]">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {customer.address}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <PaymentTermsBadge terms={customer.paymentTerms} />
              {customer.creditLimit != null && (
                <span className="text-xs text-[#8B95A5]">
                  Credit limit: <span className="text-white font-medium">{formatCurrency(customer.creditLimit)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] text-sm text-[#8B95A5] hover:text-white transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CustomerDetailTabs activeTab={tab} customerId={customer.id} />

      {/* Tab content */}
      <div className="mt-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-[#8B95A5]" />
                <h3 className="text-sm font-semibold text-white">Company Info</h3>
              </div>
              <dl className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Billing Contact</dt>
                  <dd className="text-sm text-white text-right">{customer.billingContact ?? '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Email</dt>
                  <dd className="text-sm text-right">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-[#00C650] hover:underline">
                        {customer.email}
                      </a>
                    ) : '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Phone</dt>
                  <dd className="text-sm text-white text-right">{customer.phone ?? '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Address</dt>
                  <dd className="text-sm text-white text-right">{customer.address ?? '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Payment Terms</dt>
                  <dd className="text-sm text-right">
                    <PaymentTermsBadge terms={customer.paymentTerms} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Credit Limit</dt>
                  <dd className="text-sm text-white text-right font-medium">
                    {customer.creditLimit != null ? formatCurrency(customer.creditLimit) : '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Status</dt>
                  <dd className="text-sm text-right">
                    <CustomerStatusBadge status={customer.status} />
                  </dd>
                </div>
                <div className="border-t border-[#1A2235] pt-3 flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Created</dt>
                  <dd className="text-sm text-[#8B95A5] text-right">{formatDate(customer.createdAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs text-[#8B95A5] flex-shrink-0">Last Updated</dt>
                  <dd className="text-sm text-[#8B95A5] text-right">{formatDate(customer.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-4 w-4 text-[#8B95A5]" />
                <h3 className="text-sm font-semibold text-white">Notes</h3>
              </div>
              {customer.notes ? (
                <p className="text-sm text-[#8B95A5] leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-sm text-[#8B95A5] italic">No notes added.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'invoices' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-10 w-10 text-[#1A2235] mb-3" />
            <p className="text-sm text-[#8B95A5]">Invoices for this customer will appear here.</p>
            <p className="text-xs text-[#8B95A5]/60 mt-1">Coming soon — once Invoice CRUD is built.</p>
          </div>
        )}

        {tab === 'loads' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Truck className="h-10 w-10 text-[#1A2235] mb-3" />
            <p className="text-sm text-[#8B95A5]">Loads for this customer will appear here.</p>
            <p className="text-xs text-[#8B95A5]/60 mt-1">Coming soon — once Loads CRUD is built.</p>
          </div>
        )}
      </div>
    </div>
  );
}
