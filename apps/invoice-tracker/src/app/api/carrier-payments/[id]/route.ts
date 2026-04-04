import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateCarrierPaymentSchema = z.object({
  carrierId: z.string().optional().nullable(),
  carrierName: z.string().min(1).optional(),
  loadRef: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  payType: z.enum(['standard', 'quick_pay', 'hold']).optional(),
  quickPayDiscount: z.number().min(0).max(100).optional().nullable(),
  netAmount: z.number().positive().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'disputed']).optional(),
  scheduledDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [payment] = await db
    .select()
    .from(carrierPayments)
    .where(eq(carrierPayments.id, id))
    .limit(1);

  if (!payment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(payment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const parsed = UpdateCarrierPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates = {
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  const [updated] = await db
    .update(carrierPayments)
    .set(updates)
    .where(eq(carrierPayments.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(carrierPayments).where(eq(carrierPayments.id, id));
  return NextResponse.json({ success: true });
}
