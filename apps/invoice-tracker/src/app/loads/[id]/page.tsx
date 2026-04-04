export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { loads, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LoadDetailClient } from './LoadDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LoadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [load, allCustomers] = await Promise.all([
    db.select().from(loads).where(eq(loads.id, id)).limit(1),
    db.select().from(customers),
  ]);

  if (!load.length) {
    notFound();
  }

  const l = load[0];
  const customer = allCustomers.find((c) => c.id === l.customerId) ?? null;

  const loadWithCustomer = {
    ...l,
    customer: customer ? { id: customer.id, name: customer.name } : null,
  };

  const customerList = allCustomers.map((c) => ({ id: c.id, name: c.name }));

  return <LoadDetailClient load={loadWithCustomer} customers={customerList} />;
}
