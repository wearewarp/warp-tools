import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments, portalCustomers, portalDocuments, portalEvents } from '@/db/schema';
import { eq, like, or, sql, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const customerId = searchParams.get('customerId') || '';

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(portalShipments.shipmentNumber, `%${search}%`),
        like(portalCustomers.name, `%${search}%`)
      )
    );
  }
  if (status) {
    conditions.push(eq(portalShipments.status, status));
  }
  if (customerId) {
    conditions.push(eq(portalShipments.customerId, customerId));
  }

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
      createdAt: portalShipments.createdAt,
      docCount: sql<number>`(SELECT COUNT(*) FROM portal_documents WHERE shipment_id = ${portalShipments.id})`,
    })
    .from(portalShipments)
    .leftJoin(portalCustomers, eq(portalShipments.customerId, portalCustomers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${portalShipments.createdAt} DESC`);

  return NextResponse.json({ shipments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Auto-generate shipment number if blank
  let shipmentNumber = body.shipmentNumber?.trim();
  if (!shipmentNumber) {
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(portalShipments);
    const count = countResult[0]?.count ?? 0;
    shipmentNumber = `SHP-${String(count + 1).padStart(4, '0')}`;
  }

  const id = crypto.randomUUID();
  await db.insert(portalShipments).values({
    id,
    customerId: body.customerId,
    shipmentNumber,
    status: body.status || 'booked',
    equipmentType: body.equipmentType || null,
    commodity: body.commodity || null,
    weight: body.weight ? Number(body.weight) : null,
    pieces: body.pieces ? Number(body.pieces) : null,
    originCity: body.originCity,
    originState: body.originState,
    originZip: body.originZip || null,
    originAddress: body.originAddress || null,
    originContactName: body.originContactName || null,
    originContactPhone: body.originContactPhone || null,
    destCity: body.destCity,
    destState: body.destState,
    destZip: body.destZip || null,
    destAddress: body.destAddress || null,
    destContactName: body.destContactName || null,
    destContactPhone: body.destContactPhone || null,
    pickupDate: body.pickupDate || null,
    pickupTimeWindow: body.pickupTimeWindow || null,
    deliveryDate: body.deliveryDate || null,
    deliveryTimeWindow: body.deliveryTimeWindow || null,
    customerRate: body.customerRate ? Number(body.customerRate) : null,
    invoiceRef: body.invoiceRef || null,
    invoiceStatus: body.invoiceStatus || 'pending',
    invoiceAmount: body.invoiceAmount ? Number(body.invoiceAmount) : null,
    specialInstructions: body.specialInstructions || null,
    bolNumber: body.bolNumber || null,
    poNumber: body.poNumber || null,
    proNumber: body.proNumber || null,
  });

  // Create initial event
  await db.insert(portalEvents).values({
    id: crypto.randomUUID(),
    shipmentId: id,
    eventType: 'status_change',
    description: 'Shipment created',
    isVisibleToCustomer: true,
  });

  const [shipment] = await db
    .select()
    .from(portalShipments)
    .where(eq(portalShipments.id, id));

  return NextResponse.json({ shipment }, { status: 201 });
}
