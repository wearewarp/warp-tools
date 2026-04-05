import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalCustomers, portalShipments } from '@/db/schema';
import { eq, like, or, sql, count } from 'drizzle-orm';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search') ?? '';

  const baseQuery = db
    .select({
      id: portalCustomers.id,
      name: portalCustomers.name,
      contactName: portalCustomers.contactName,
      contactEmail: portalCustomers.contactEmail,
      contactPhone: portalCustomers.contactPhone,
      accessToken: portalCustomers.accessToken,
      isActive: portalCustomers.isActive,
      lastLoginAt: portalCustomers.lastLoginAt,
      notes: portalCustomers.notes,
      createdAt: portalCustomers.createdAt,
      updatedAt: portalCustomers.updatedAt,
      shipmentCount: count(portalShipments.id),
    })
    .from(portalCustomers)
    .leftJoin(portalShipments, eq(portalShipments.customerId, portalCustomers.id))
    .groupBy(portalCustomers.id);

  const customers = search
    ? await baseQuery.where(
        or(
          like(portalCustomers.name, `%${search}%`),
          like(portalCustomers.contactEmail, `%${search}%`)
        )
      )
    : await baseQuery;

  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, contactName, contactEmail, contactPhone, notes, isActive } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const accessToken = crypto.randomUUID();
  const now = new Date().toISOString();

  const [customer] = await db
    .insert(portalCustomers)
    .values({
      id,
      name: name.trim(),
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      notes: notes || null,
      isActive: isActive !== false,
      accessToken,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ customer }, { status: 201 });
}
