import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, paymentsReceived } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const PatchPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['ach', 'wire', 'check', 'credit_card', 'factoring', 'other']).optional(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function syncInvoicePaymentStatus(invoiceId: string) {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) return;

  const payments = await db.select().from(paymentsReceived).where(eq(paymentsReceived.invoiceId, invoiceId));
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  let status = inv.status;
  if (inv.status !== 'void') {
    if (totalPaid >= inv.total) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    } else {
      if (inv.status === 'paid' || inv.status === 'partially_paid') {
        status = 'sent';
      }
    }
  }

  await db
    .update(invoices)
    .set({
      amountPaid: totalPaid,
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(invoices.id, invoiceId));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;

  const [existing] = await db.select().from(paymentsReceived).where(eq(paymentsReceived.id, paymentId));
  if (!existing || existing.invoiceId !== id) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {};
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.paymentDate !== undefined) updates.paymentDate = data.paymentDate;
  if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
  if (data.referenceNumber !== undefined) updates.referenceNumber = data.referenceNumber;
  if (data.notes !== undefined) updates.notes = data.notes;

  const [updated] = await db
    .update(paymentsReceived)
    .set(updates as Parameters<ReturnType<typeof db.update>['set']>[0])
    .where(eq(paymentsReceived.id, paymentId))
    .returning();

  await syncInvoicePaymentStatus(id);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const { id, paymentId } = await params;

  const [existing] = await db.select().from(paymentsReceived).where(eq(paymentsReceived.id, paymentId));
  if (!existing || existing.invoiceId !== id) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  await db.delete(paymentsReceived).where(eq(paymentsReceived.id, paymentId));
  await syncInvoicePaymentStatus(id);

  return NextResponse.json({ success: true });
}
