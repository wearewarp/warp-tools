export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, FileText, Tag, Calendar, DollarSign, ClipboardList } from 'lucide-react';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';
import { PayTypeBadge } from '@/components/PayTypeBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentActions } from './PaymentActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CarrierPaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [payment] = await db
    .select()
    .from(carrierPayments)
    .where(eq(carrierPayments.id, id))
    .limit(1);

  if (!payment) notFound();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/payments"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Payments
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-white">{payment.carrierName}</h1>
              <PaymentStatusBadge status={payment.status} />
            </div>
            {payment.loadRef && (
              <div className="flex items-center gap-1.5 text-sm text-[#8B95A5] mb-2">
                <FileText className="h-3.5 w-3.5" />
                Load: <span className="text-white font-mono">{payment.loadRef}</span>
              </div>
            )}
            <div className="mt-3">
              <span className="text-3xl font-bold text-white">{formatCurrency(payment.amount)}</span>
              {payment.payType === 'quick_pay' && payment.amount !== payment.netAmount && (
                <span className="ml-3 text-sm text-[#8B95A5]">
                  Net: <span className="text-[#00C650] font-semibold">{formatCurrency(payment.netAmount)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/payments/${payment.id}/edit`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] hover:border-[#2A3347] text-sm text-[#8B95A5] hover:text-white transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-[#1A2235]">
          <PaymentActions paymentId={payment.id} status={payment.status} />
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-[#8B95A5]" />
          <h3 className="text-sm font-semibold text-white">Payment Details</h3>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start justify-between gap-4 sm:col-span-1">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Pay Type</dt>
            <dd className="text-sm text-right">
              <PayTypeBadge payType={payment.payType} />
            </dd>
          </div>

          {payment.payType === 'quick_pay' && payment.quickPayDiscount != null && (
            <div className="flex items-start justify-between gap-4">
              <dt className="text-xs text-[#8B95A5] flex-shrink-0">Quick Pay Discount</dt>
              <dd className="text-sm text-white text-right font-medium">
                {payment.quickPayDiscount}%
                <span className="text-[#8B95A5] font-normal ml-1">
                  (−{formatCurrency(payment.amount - payment.netAmount)})
                </span>
              </dd>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Gross Amount</dt>
            <dd className="text-sm text-white text-right font-medium">{formatCurrency(payment.amount)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Net Amount</dt>
            <dd className={`text-sm text-right font-semibold ${payment.payType === 'quick_pay' && payment.amount !== payment.netAmount ? 'text-[#00C650]' : 'text-white'}`}>
              {formatCurrency(payment.netAmount)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Status</dt>
            <dd className="text-sm text-right">
              <PaymentStatusBadge status={payment.status} />
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Scheduled Date</dt>
            <dd className="text-sm text-white text-right">{formatDate(payment.scheduledDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Paid Date</dt>
            <dd className="text-sm text-white text-right">{formatDate(payment.paidDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Reference #</dt>
            <dd className="text-sm text-white text-right font-mono">
              {payment.referenceNumber || '—'}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Load Ref</dt>
            <dd className="text-sm text-white text-right font-mono">
              {payment.loadRef || '—'}
            </dd>
          </div>

          <div className="border-t border-[#1A2235] pt-3 flex items-start justify-between gap-4 sm:col-span-2">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Created</dt>
            <dd className="text-sm text-[#8B95A5] text-right">{formatDate(payment.createdAt)}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 sm:col-span-2">
            <dt className="text-xs text-[#8B95A5] flex-shrink-0">Last Updated</dt>
            <dd className="text-sm text-[#8B95A5] text-right">{formatDate(payment.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="h-4 w-4 text-[#8B95A5]" />
            <h3 className="text-sm font-semibold text-white">Notes</h3>
          </div>
          <p className="text-sm text-[#8B95A5] leading-relaxed whitespace-pre-wrap">{payment.notes}</p>
        </div>
      )}
    </div>
  );
}
