export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { portalShipments, portalCustomers, portalEvents, portalDocuments, portalMessages } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './ShipmentDetailClient';

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const results = await db
    .select({
      id: portalShipments.id,
      shipmentNumber: portalShipments.shipmentNumber,
      status: portalShipments.status,
      customerId: portalShipments.customerId,
      customerName: portalCustomers.name,
      equipmentType: portalShipments.equipmentType,
      commodity: portalShipments.commodity,
      weight: portalShipments.weight,
      pieces: portalShipments.pieces,
      originCity: portalShipments.originCity,
      originState: portalShipments.originState,
      originZip: portalShipments.originZip,
      originAddress: portalShipments.originAddress,
      originContactName: portalShipments.originContactName,
      originContactPhone: portalShipments.originContactPhone,
      destCity: portalShipments.destCity,
      destState: portalShipments.destState,
      destZip: portalShipments.destZip,
      destAddress: portalShipments.destAddress,
      destContactName: portalShipments.destContactName,
      destContactPhone: portalShipments.destContactPhone,
      pickupDate: portalShipments.pickupDate,
      pickupTimeWindow: portalShipments.pickupTimeWindow,
      deliveryDate: portalShipments.deliveryDate,
      deliveryTimeWindow: portalShipments.deliveryTimeWindow,
      actualPickupAt: portalShipments.actualPickupAt,
      actualDeliveryAt: portalShipments.actualDeliveryAt,
      customerRate: portalShipments.customerRate,
      invoiceRef: portalShipments.invoiceRef,
      invoiceStatus: portalShipments.invoiceStatus,
      invoiceAmount: portalShipments.invoiceAmount,
      specialInstructions: portalShipments.specialInstructions,
      bolNumber: portalShipments.bolNumber,
      poNumber: portalShipments.poNumber,
      proNumber: portalShipments.proNumber,
      currentLocationCity: portalShipments.currentLocationCity,
      currentLocationState: portalShipments.currentLocationState,
      currentEta: portalShipments.currentEta,
      createdAt: portalShipments.createdAt,
      updatedAt: portalShipments.updatedAt,
      docCount: sql<number>`(SELECT COUNT(*) FROM portal_documents WHERE shipment_id = ${portalShipments.id})`,
    })
    .from(portalShipments)
    .leftJoin(portalCustomers, eq(portalShipments.customerId, portalCustomers.id))
    .where(eq(portalShipments.id, id));

  const shipment = results[0];
  if (!shipment) notFound();

  const events = await db
    .select()
    .from(portalEvents)
    .where(eq(portalEvents.shipmentId, id))
    .orderBy(sql`${portalEvents.createdAt} DESC`);

  const documents = await db
    .select()
    .from(portalDocuments)
    .where(eq(portalDocuments.shipmentId, id))
    .orderBy(sql`${portalDocuments.uploadedAt} DESC`);

  const messages = await db
    .select()
    .from(portalMessages)
    .where(eq(portalMessages.shipmentId, id))
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  return (
    <ShipmentDetailClient
      shipment={shipment}
      events={events}
      documents={documents}
      messages={messages}
    />
  );
}
