export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PaymentForm } from '../../PaymentForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPaymentPage({ params }: PageProps) {
  const { id } = await params;
  const [payment] = await db
    .select()
    .from(carrierPayments)
    .where(eq(carrierPayments.id, id))
    .limit(1);

  if (!payment) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link
        href={`/payments/${payment.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payment
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Payment</h1>
        <p className="text-[#8B95A5] text-sm mt-1">{payment.carrierName}</p>
      </div>

      <PaymentForm
        mode="edit"
        paymentId={payment.id}
        initialData={{
          carrierName: payment.carrierName,
          loadRef: payment.loadRef ?? '',
          amount: payment.amount.toString(),
          payType: payment.payType,
          quickPayDiscount: payment.quickPayDiscount?.toString() ?? '',
          scheduledDate: payment.scheduledDate ?? '',
          notes: payment.notes ?? '',
        }}
      />
    </div>
  );
}
