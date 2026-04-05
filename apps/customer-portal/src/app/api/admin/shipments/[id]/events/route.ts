import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalEvents } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = await db
    .select()
    .from(portalEvents)
    .where(eq(portalEvents.shipmentId, id))
    .orderBy(sql`${portalEvents.createdAt} ASC`);
  return NextResponse.json({ events });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { description, eventType, locationCity, locationState, isVisibleToCustomer } = body;

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const [event] = await db
    .insert(portalEvents)
    .values({
      id: crypto.randomUUID(),
      shipmentId: id,
      eventType: eventType || 'note',
      description,
      locationCity: locationCity || null,
      locationState: locationState || null,
      isVisibleToCustomer: isVisibleToCustomer !== false,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}
