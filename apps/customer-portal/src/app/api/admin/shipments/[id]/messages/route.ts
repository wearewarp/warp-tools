import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalMessages, portalCustomers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    .where(eq(portalMessages.shipmentId, id))
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  // Mark customer messages as read
  await db
    .update(portalMessages)
    .set({ isRead: true })
    .where(eq(portalMessages.shipmentId, id));

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { customerId, message } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const [msg] = await db
    .insert(portalMessages)
    .values({
      id: crypto.randomUUID(),
      shipmentId: id,
      customerId: customerId || null,
      senderType: 'broker',
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ message: msg }, { status: 201 });
}
