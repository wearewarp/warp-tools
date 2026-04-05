import { db } from '@/db';
import { portalCustomers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { CustomerForm } from '../../CustomerForm';

export const dynamic = 'force-dynamic';

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer] = await db.select().from(portalCustomers).where(eq(portalCustomers.id, id));
  if (!customer) notFound();

  return (
    <div>
      <CustomerForm mode="edit" customer={customer} />
    </div>
  );
}
