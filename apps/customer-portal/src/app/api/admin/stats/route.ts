import { NextResponse } from 'next/server';
import { db } from '@/db';
import { portalCustomers, portalShipments, portalMessages, portalDocuments } from '@/db/schema';
import { eq, notInArray, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [
    customerRows,
    shipmentRows,
    messageRows,
    documentRows,
    activeShipmentRows,
    inTransitRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(portalCustomers),
    db.select({ count: sql<number>`count(*)` }).from(portalShipments),
    db
      .select({ count: sql<number>`count(*)` })
      .from(portalMessages)
      .where(
        and(
          eq(portalMessages.isRead, false),
          eq(portalMessages.senderType, 'customer')
        )
      ),
    db.select({ count: sql<number>`count(*)` }).from(portalDocuments),
    db
      .select({ count: sql<number>`count(*)` })
      .from(portalShipments)
      .where(notInArray(portalShipments.status, ['closed', 'cancelled', 'delivered', 'invoiced'])),
    db
      .select({ count: sql<number>`count(*)` })
      .from(portalShipments)
      .where(eq(portalShipments.status, 'in_transit')),
  ]);

  return NextResponse.json({
    totalCustomers: Number(customerRows[0]?.count ?? 0),
    totalShipments: Number(shipmentRows[0]?.count ?? 0),
    unreadMessages: Number(messageRows[0]?.count ?? 0),
    documentsUploaded: Number(documentRows[0]?.count ?? 0),
    activeShipments: Number(activeShipmentRows[0]?.count ?? 0),
    inTransitCount: Number(inTransitRows[0]?.count ?? 0),
  });
}
