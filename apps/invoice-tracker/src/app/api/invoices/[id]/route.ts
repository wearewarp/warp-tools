import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceLineItems, paymentsReceived, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const PatchInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  customerId: z.string().optional(),
  loadRef: z.string().optional().nullable(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  taxAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void']).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      customerAddressStreet: customers.addressStreet,
      customerAddressCity: customers.addressCity,
      customerAddressState: customers.addressState,
      customerAddressZip: customers.addressZip,
      customerPaymentTerms: customers.paymentTerms,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, id));

  if (!row) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));

  const payments = await db
    .select()
    .from(paymentsReceived)
    .where(eq(paymentsReceived.invoiceId, id));

  const addrParts = [
    row.customerAddressStreet,
    row.customerAddressCity,
    [row.customerAddressState, row.customerAddressZip].filter(Boolean).join(' '),
  ].filter(Boolean);
  const customerAddress = addrParts.length > 0 ? addrParts.join(', ') : null;

  // Compute effective status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(row.invoice.dueDate);
  due.setHours(0, 0, 0, 0);
  let effectiveStatus = row.invoice.status;
  if (row.invoice.status === 'sent' && due < today) {
    effectiveStatus = 'overdue';
  }

  return NextResponse.json({
    ...row.invoice,
    effectiveStatus,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerAddress: customerAddress,
    customerPaymentTerms: row.customerPaymentTerms,
    lineItems,
    payments,
    balanceDue: row.invoice.total - row.invoice.amountPaid,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (data.invoiceNumber !== undefined) updates.invoiceNumber = data.invoiceNumber;
  if (data.customerId !== undefined) updates.customerId = data.customerId;
  if (data.loadRef !== undefined) updates.loadRef = data.loadRef;
  if (data.invoiceDate !== undefined) updates.invoiceDate = data.invoiceDate;
  if (data.dueDate !== undefined) updates.dueDate = data.dueDate;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.status !== undefined) updates.status = data.status;
  if (data.taxAmount !== undefined) {
    updates.taxAmount = data.taxAmount;
    updates.total = existing.subtotal + data.taxAmount;
  }

  const [updated] = await db
    .update(invoices)
    .set(updates as Parameters<ReturnType<typeof db.update>['set']>[0])
    .where(eq(invoices.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Soft delete — void only
  const [updated] = await db
    .update(invoices)
    .set({ status: 'void', updatedAt: new Date().toISOString() })
    .where(eq(invoices.id, id))
    .returning();

  return NextResponse.json(updated);
}
