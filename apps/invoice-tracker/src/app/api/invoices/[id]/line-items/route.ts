import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const AddLineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  lineType: z.enum(['freight', 'fuel_surcharge', 'detention', 'accessorial', 'lumper', 'other']).default('freight'),
});

async function recalcInvoiceTotals(invoiceId: string) {
  const items = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  const subtotal = items.reduce((sum, li) => sum + li.amount, 0);

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!inv) return;

  const total = subtotal + inv.taxAmount;
  await db
    .update(invoices)
    .set({ subtotal, total, updatedAt: new Date().toISOString() })
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
  const parsed = AddLineItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const amount = data.quantity * data.unitPrice;

  const [lineItem] = await db
    .insert(invoiceLineItems)
    .values({
      invoiceId: id,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount,
      lineType: data.lineType,
    })
    .returning();

  await recalcInvoiceTotals(id);

  return NextResponse.json(lineItem, { status: 201 });
}
