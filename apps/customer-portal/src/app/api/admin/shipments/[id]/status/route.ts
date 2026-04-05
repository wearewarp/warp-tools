import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments, portalEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [current] = await db
    .select()
    .from(portalShipments)
    .where(eq(portalShipments.id, id));

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db
    .update(portalShipments)
    .set({ status: body.status, updatedAt: new Date().toISOString() })
    .where(eq(portalShipments.id, id));

  const eventId = crypto.randomUUID();
  const description = body.notes
    ? `Status changed from ${current.status} to ${body.status}: ${body.notes}`
    : `Status changed from ${current.status} to ${body.status}`;

  await db.insert(portalEvents).values({
    id: eventId,
    shipmentId: id,
    eventType: 'status_change',
    description,
    isVisibleToCustomer: true,
  });

  const [shipment] = await db
    .select()
    .from(portalShipments)
    .where(eq(portalShipments.id, id));

  const [event] = await db
    .select()
    .from(portalEvents)
    .where(eq(portalEvents.id, eventId));

  return NextResponse.json({ shipment, event });
}
