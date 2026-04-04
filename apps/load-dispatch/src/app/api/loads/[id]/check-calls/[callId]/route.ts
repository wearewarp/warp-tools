import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checkCalls } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string; callId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { callId } = await params;
  const id = parseInt(callId, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid callId' }, { status: 400 });

  const body = await req.json();
  const { status, location_city, location_state, eta, notes, contact_method } = body;

  const updateData: Record<string, string | null> = {};
  if (status !== undefined) updateData['status'] = status;
  if (location_city !== undefined) updateData['location_city'] = location_city;
  if (location_state !== undefined) updateData['location_state'] = location_state;
  if (eta !== undefined) updateData['eta'] = eta;
  if (notes !== undefined) updateData['notes'] = notes;
  if (contact_method !== undefined) updateData['contact_method'] = contact_method;

  await db.update(checkCalls).set(updateData as never).where(eq(checkCalls.id, id));
  const [updated] = await db.select().from(checkCalls).where(eq(checkCalls.id, id)).limit(1);
  return NextResponse.json({ checkCall: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { callId } = await params;
  const id = parseInt(callId, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid callId' }, { status: 400 });

  await db.delete(checkCalls).where(eq(checkCalls.id, id));
  return NextResponse.json({ success: true });
}
