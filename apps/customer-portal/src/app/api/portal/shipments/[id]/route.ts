import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments, portalEvents, portalDocuments, portalMessages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getPortalCustomer } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const customer = await getPortalCustomer(request);
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [shipment] = await db
    .select({
      id: portalShipments.id,
      shipmentNumber: portalShipments.shipmentNumber,
      status: portalShipments.status,
      equipmentType: portalShipments.equipmentType,
      commodity: portalShipments.commodity,
      weight: portalShipments.weight,
      pieces: portalShipments.pieces,
      originCity: portalShipments.originCity,
      originState: portalShipments.originState,
      originZip: portalShipments.originZip,
      originAddress: portalShipments.originAddress,
      destCity: portalShipments.destCity,
      destState: portalShipments.destState,
      destZip: portalShipments.destZip,
      destAddress: portalShipments.destAddress,
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
      currentLocationCity: portalShipments.currentLocationCity,
      currentLocationState: portalShipments.currentLocationState,
      currentEta: portalShipments.currentEta,
      customerId: portalShipments.customerId,
      createdAt: portalShipments.createdAt,
      updatedAt: portalShipments.updatedAt,
    })
    .from(portalShipments)
    .where(
      and(
        eq(portalShipments.id, id),
        eq(portalShipments.customerId, customer.id)
      )
    );

  if (!shipment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only return customer-visible events
  const events = await db
    .select({
      id: portalEvents.id,
      eventType: portalEvents.eventType,
      description: portalEvents.description,
      locationCity: portalEvents.locationCity,
      locationState: portalEvents.locationState,
      createdAt: portalEvents.createdAt,
    })
    .from(portalEvents)
    .where(
      and(
        eq(portalEvents.shipmentId, id),
        eq(portalEvents.isVisibleToCustomer, true)
      )
    )
    .orderBy(sql`${portalEvents.createdAt} DESC`);

  // Only return customer-visible documents (no sensitive types exposed)
  const documents = await db
    .select({
      id: portalDocuments.id,
      docType: portalDocuments.docType,
      filename: portalDocuments.filename,
      originalName: portalDocuments.originalName,
      fileSize: portalDocuments.fileSize,
      mimeType: portalDocuments.mimeType,
      uploadedAt: portalDocuments.uploadedAt,
    })
    .from(portalDocuments)
    .where(
      and(
        eq(portalDocuments.shipmentId, id),
        eq(portalDocuments.isVisibleToCustomer, true)
      )
    )
    .orderBy(sql`${portalDocuments.uploadedAt} DESC`);

  const messages = await db
    .select({
      id: portalMessages.id,
      senderType: portalMessages.senderType,
      message: portalMessages.message,
      isRead: portalMessages.isRead,
      createdAt: portalMessages.createdAt,
    })
    .from(portalMessages)
    .where(
      and(
        eq(portalMessages.shipmentId, id),
        eq(portalMessages.customerId, customer.id)
      )
    )
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  return NextResponse.json({ shipment, events, documents, messages });
}
