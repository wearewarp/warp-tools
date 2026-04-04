export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CustomerForm } from '../CustomerForm';

export default function NewCustomerPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Customers
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Add Customer</h1>
        <p className="text-[#8B95A5] text-sm mt-1">Create a new customer account.</p>
      </div>

      <CustomerForm mode="create" />
    </div>
  );
}
