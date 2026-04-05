import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalMessages, portalCustomers } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getPortalCustomerFromCookies } from '@/lib/portal-auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const customer = await getPortalCustomerFromCookies();
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shipmentId = request.nextUrl.searchParams.get('shipmentId');

  const conditions = [eq(portalMessages.customerId, customer.id)];
  if (shipmentId) conditions.push(eq(portalMessages.shipmentId, shipmentId));

  const messages = await db
    .select({
      id: portalMessages.id,
      shipmentId: portalMessages.shipmentId,
      customerId: portalMessages.customerId,
      customerName: portalCustomers.name,
      senderType: portalMessages.senderType,
      message: portalMessages.message,
      isRead: portalMessages.isRead,
      createdAt: portalMessages.createdAt,
    })
    .from(portalMessages)
    .leftJoin(portalCustomers, eq(portalMessages.customerId, portalCustomers.id))
    .where(and(...conditions))
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  // Mark broker messages as read
  await db
    .update(portalMessages)
    .set({ isRead: true })
    .where(and(
      eq(portalMessages.customerId, customer.id),
      eq(portalMessages.senderType, 'broker')
    ));

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const customer = await getPortalCustomerFromCookies();
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { shipmentId, message } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const [msg] = await db
    .insert(portalMessages)
    .values({
      id: crypto.randomUUID(),
      customerId: customer.id,
      shipmentId: shipmentId || null,
      senderType: 'customer',
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ message: msg }, { status: 201 });
}
