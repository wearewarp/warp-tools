import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params;
  await db.delete(portalEvents).where(eq(portalEvents.id, eventId));
  return NextResponse.json({ success: true });
}
