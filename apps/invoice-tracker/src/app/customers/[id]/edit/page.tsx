export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CustomerForm } from '../../CustomerForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) notFound();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link
        href={`/customers/${customer.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {customer.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Customer</h1>
        <p className="text-[#8B95A5] text-sm mt-1">{customer.name}</p>
      </div>

      <CustomerForm
        mode="edit"
        customerId={customer.id}
        initialData={{
          name: customer.name,
          billingContact: customer.billingContact ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          addressStreet: customer.addressStreet ?? '',
          addressCity: customer.addressCity ?? '',
          addressState: customer.addressState ?? '',
          addressZip: customer.addressZip ?? '',
          paymentTerms: customer.paymentTerms,
          creditLimit: customer.creditLimit != null ? String(customer.creditLimit) : '',
          notes: customer.notes ?? '',
          status: customer.status,
        }}
      />
    </div>
  );
}
