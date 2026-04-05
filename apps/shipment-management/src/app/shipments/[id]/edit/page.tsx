export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { EditShipmentForm } from './EditShipmentForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditShipmentPage({ params }: Props) {
  const { id } = await params;
  const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
  if (!shipment) notFound();

  return <EditShipmentForm shipment={shipment} />;
}
