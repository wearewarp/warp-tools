import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments, portalCustomers, portalEvents, portalDocuments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [shipment] = await db
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

  if (!shipment) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }

  const events = await db
    .select()
    .from(portalEvents)
    .where(eq(portalEvents.shipmentId, id))
    .orderBy(sql`${portalEvents.createdAt} ASC`);

  const documents = await db
    .select()
    .from(portalDocuments)
    .where(eq(portalDocuments.shipmentId, id));

  return NextResponse.json({ shipment, events, documents });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [existing] = await db.select().from(portalShipments).where(eq(portalShipments.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  const fields = [
    'customerId', 'shipmentNumber', 'status', 'equipmentType', 'commodity',
    'weight', 'pieces', 'originCity', 'originState', 'originZip', 'originAddress',
    'originContactName', 'originContactPhone', 'destCity', 'destState', 'destZip',
    'destAddress', 'destContactName', 'destContactPhone', 'pickupDate', 'pickupTimeWindow',
    'deliveryDate', 'deliveryTimeWindow', 'actualPickupAt', 'actualDeliveryAt',
    'customerRate', 'invoiceRef', 'invoiceStatus', 'invoiceAmount',
    'specialInstructions', 'bolNumber', 'poNumber', 'proNumber',
    'currentLocationCity', 'currentLocationState', 'currentEta',
  ];

  for (const field of fields) {
    if (field in body) updates[field] = body[field];
  }

  const [shipment] = await db.update(portalShipments).set(updates).where(eq(portalShipments.id, id)).returning();

  // If status changed, create an event
  if (body.status && body.status !== existing.status) {
    await db.insert(portalEvents).values({
      id: crypto.randomUUID(),
      shipmentId: id,
      eventType: 'status_change',
      description: `Status changed to ${body.status.replace(/_/g, ' ')}`,
      isVisibleToCustomer: true,
      createdAt: now,
    });
  }

  return NextResponse.json({ shipment });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(portalShipments).where(eq(portalShipments.id, id));
  return NextResponse.json({ success: true });
}
