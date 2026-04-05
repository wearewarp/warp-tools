import { db } from '@/db';
import { portalCustomers, portalShipments, portalMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { CustomerDetailClient } from './CustomerDetailClient';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer] = await db.select().from(portalCustomers).where(eq(portalCustomers.id, id));
  if (!customer) notFound();

  const shipments = await db.select().from(portalShipments).where(eq(portalShipments.customerId, id));
  const messages = await db.select().from(portalMessages).where(eq(portalMessages.customerId, id));

  return <CustomerDetailClient customer={customer} shipments={shipments} messages={messages} />;
}
