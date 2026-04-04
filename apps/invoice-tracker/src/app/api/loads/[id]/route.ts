import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateLoadSchema = z.object({
  loadRef: z.string().min(1).optional(),
  customerId: z.string().optional(),
  carrierId: z.string().optional().nullable(),
  carrierName: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  revenue: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  status: z.enum(['booked', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled']).optional(),
  pickupDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  carrierPaymentId: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const load = await db.select().from(loads).where(eq(loads.id, id)).limit(1);
  if (!load.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const customer = load[0].customerId
    ? await db.select().from(customers).where(eq(customers.id, load[0].customerId)).limit(1)
    : [];

  return NextResponse.json({
    ...load[0],
    customer: customer[0] ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateLoadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db
    .update(loads)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(loads.id, id))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(loads).where(eq(loads.id, id));
  return NextResponse.json({ success: true });
}
