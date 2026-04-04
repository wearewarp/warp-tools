import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  billingContact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  paymentTerms: z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'quick_pay', 'factored']).optional(),
  creditLimit: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'on_hold']).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.email === '') body.email = null;

  const parsed = UpdateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  const [updated] = await db
    .update(customers)
    .set(updates)
    .where(eq(customers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(customers).where(eq(customers.id, id));
  return NextResponse.json({ success: true });
}
