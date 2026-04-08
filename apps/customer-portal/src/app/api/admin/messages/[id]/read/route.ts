import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [updated] = await db
    .update(portalMessages)
    .set({ isRead: true })
    .where(eq(portalMessages.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json({ message: updated });
}
