import { db } from '@/db';
import { portalShipments, portalCustomers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ShipmentFormClient } from '../../ShipmentFormClient';

export const dynamic = 'force-dynamic';

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [shipment] = await db.select().from(portalShipments).where(eq(portalShipments.id, id));
  if (!shipment) notFound();

  const customers = await db.select({
    id: portalCustomers.id,
    name: portalCustomers.name,
  }).from(portalCustomers);

  return <ShipmentFormClient mode="edit" shipment={shipment} customers={customers} />;
}
