import { db } from '@/db';
import { portalShipments, portalCustomers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ShipmentListClient } from './ShipmentListClient';

export const dynamic = 'force-dynamic';

export default async function ShipmentsPage() {
  const shipments = await db
    .select({
      id: portalShipments.id,
      shipmentNumber: portalShipments.shipmentNumber,
      status: portalShipments.status,
      customerId: portalShipments.customerId,
      customerName: portalCustomers.name,
      originCity: portalShipments.originCity,
      originState: portalShipments.originState,
      destCity: portalShipments.destCity,
      destState: portalShipments.destState,
      pickupDate: portalShipments.pickupDate,
      deliveryDate: portalShipments.deliveryDate,
      customerRate: portalShipments.customerRate,
      createdAt: portalShipments.createdAt,
      docCount: sql<number>`(SELECT COUNT(*) FROM portal_documents WHERE shipment_id = ${portalShipments.id})`,
    })
    .from(portalShipments)
    .leftJoin(portalCustomers, eq(portalShipments.customerId, portalCustomers.id))
    .orderBy(sql`${portalShipments.createdAt} DESC`);

  return <ShipmentListClient shipments={shipments} />;
}
