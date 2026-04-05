import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalMessages, portalCustomers } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customerId');

  if (customerId) {
    // Return messages for a specific customer thread
    const messages = await db
      .select()
      .from(portalMessages)
      .where(eq(portalMessages.customerId, customerId))
      .orderBy(sql`${portalMessages.createdAt} ASC`);

    // Mark customer messages as read
    await db
      .update(portalMessages)
      .set({ isRead: true })
      .where(eq(portalMessages.customerId, customerId));

    return NextResponse.json({ messages });
  }

  // Get conversations grouped by customer with unread counts
  const conversations = await db
    .select({
      customerId: portalMessages.customerId,
      customerName: portalCustomers.name,
      customerContactName: portalCustomers.contactName,
      lastMessage: sql<string>`MAX(${portalMessages.message})`,
      lastMessageAt: sql<string>`MAX(${portalMessages.createdAt})`,
      unreadCount: sql<number>`SUM(CASE WHEN ${portalMessages.isRead} = 0 AND ${portalMessages.senderType} = 'customer' THEN 1 ELSE 0 END)`,
    })
    .from(portalMessages)
    .innerJoin(portalCustomers, eq(portalMessages.customerId, portalCustomers.id))
    .groupBy(portalMessages.customerId)
    .orderBy(desc(sql`MAX(${portalMessages.createdAt})`));

  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, shipmentId, message } = body;

  if (!customerId || !message) {
    return NextResponse.json({ error: 'customerId and message are required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const [msg] = await db
    .insert(portalMessages)
    .values({
      id,
      customerId,
      shipmentId: shipmentId || null,
      senderType: 'broker',
      message,
      isRead: false,
      createdAt: now,
    })
    .returning();

  return NextResponse.json({ message: msg }, { status: 201 });
}
