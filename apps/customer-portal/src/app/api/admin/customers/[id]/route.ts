import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalCustomers, portalShipments, portalMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [customer] = await db.select().from(portalCustomers).where(eq(portalCustomers.id, id));
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const shipments = await db.select().from(portalShipments).where(eq(portalShipments.customerId, id));
  const messages = await db.select().from(portalMessages).where(eq(portalMessages.customerId, id));

  return NextResponse.json({ customer, shipments, messages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, contactName, contactEmail, contactPhone, notes, isActive } = body;

  if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
    return NextResponse.json({ error: 'Company name cannot be empty' }, { status: 400 });
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (contactName !== undefined) updates.contactName = contactName || null;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail || null;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone || null;
  if (notes !== undefined) updates.notes = notes || null;
  if (isActive !== undefined) updates.isActive = isActive;

  const [customer] = await db.update(portalCustomers).set(updates).where(eq(portalCustomers.id, id)).returning();
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(portalCustomers).where(eq(portalCustomers.id, id));
  return NextResponse.json({ success: true });
}
