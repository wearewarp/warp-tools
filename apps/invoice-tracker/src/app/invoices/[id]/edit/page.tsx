export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { invoices, invoiceLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { InvoiceForm } from '../../new/InvoiceForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!invoice) notFound();

  const lineItems = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id));

  const initialData = {
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    loadRef: invoice.loadRef ?? '',
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    taxAmount: invoice.taxAmount,
    notes: invoice.notes ?? '',
    status: invoice.status,
    lineItems: lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      lineType: li.lineType as 'freight' | 'fuel_surcharge' | 'detention' | 'accessorial' | 'lumper' | 'other',
    })),
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
        <Link href={`/invoices/${id}`} className="hover:text-white transition-colors font-mono">
          {invoice.invoiceNumber}
        </Link>
        <span>/</span>
        <span className="text-white">Edit</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Invoice</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5 font-mono">{invoice.invoiceNumber}</p>
      </div>

      <InvoiceForm mode="edit" invoiceId={id} initialData={initialData} />
    </div>
  );
}
