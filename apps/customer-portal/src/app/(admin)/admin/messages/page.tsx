import { db } from '@/db';
import { portalMessages, portalCustomers } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { MessagesClient } from './MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
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

  return <MessagesClient conversations={conversations} />;
}
