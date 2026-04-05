import { redirect, notFound } from 'next/navigation';
import { getPortalCustomerFromCookies } from '@/lib/portal-auth';
import { db } from '@/db';
import { portalShipments, portalEvents, portalDocuments, portalMessages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PortalShipmentDetail } from './PortalShipmentDetail';

export const dynamic = 'force-dynamic';

export default async function PortalShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getPortalCustomerFromCookies();
  if (!customer) redirect('/portal/login');

  const { id } = await params;

  const [shipment] = await db
    .select()
    .from(portalShipments)
    .where(and(eq(portalShipments.id, id), eq(portalShipments.customerId, customer.id)));

  if (!shipment) notFound();

  const events = await db
    .select()
    .from(portalEvents)
    .where(and(eq(portalEvents.shipmentId, id), eq(portalEvents.isVisibleToCustomer, true)))
    .orderBy(sql`${portalEvents.createdAt} ASC`);

  const documents = await db
    .select()
    .from(portalDocuments)
    .where(and(eq(portalDocuments.shipmentId, id), eq(portalDocuments.isVisibleToCustomer, true)));

  const messages = await db
    .select()
    .from(portalMessages)
    .where(eq(portalMessages.shipmentId, id))
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  return (
    <PortalShipmentDetail
      customer={{ id: customer.id, name: customer.name }}
      shipment={shipment}
      events={events}
      documents={documents}
      messages={messages}
    />
  );
}
