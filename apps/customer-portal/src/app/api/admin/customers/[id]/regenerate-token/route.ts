import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalCustomers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const newToken = crypto.randomUUID();

  const [customer] = await db
    .update(portalCustomers)
    .set({ accessToken: newToken, updatedAt: new Date().toISOString() })
    .where(eq(portalCustomers.id, id))
    .returning();

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
