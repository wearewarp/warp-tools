export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';

export default function NewInvoicePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#8B95A5] mb-6">
        <Link href="/invoices" className="hover:text-white transition-colors flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Invoices
        </Link>
        <span>/</span>
        <span className="text-white">Create Invoice</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Invoice</h1>
        <p className="text-[#8B95A5] text-sm mt-0.5">
          Fill in the details below to create a new invoice.
        </p>
      </div>

      <InvoiceForm mode="create" />
    </div>
  );
}
