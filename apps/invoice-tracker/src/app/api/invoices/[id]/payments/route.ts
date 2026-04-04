import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, paymentsReceived } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const RecordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date required'),
  paymentMethod: z.enum(['ach', 'wire', 'check', 'credit_card', 'factoring', 'other']).default('ach'),
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
      // If no payments, revert to sent if it was paid/partially_paid
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = RecordPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const [payment] = await db
    .insert(paymentsReceived)
    .values({
      invoiceId: id,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber ?? null,
      notes: data.notes ?? null,
    })
    .returning();

  await syncInvoicePaymentStatus(id);

  return NextResponse.json(payment, { status: 201 });
}
