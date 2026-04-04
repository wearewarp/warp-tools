import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, invoiceLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const PatchLineItemSchema = z.object({
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  lineType: z.enum(['freight', 'fuel_surcharge', 'detention', 'accessorial', 'lumper', 'other']).optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id, lineId } = await params;

  const [existing] = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.id, lineId));
  if (!existing || existing.invoiceId !== id) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchLineItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const newQty = data.quantity ?? existing.quantity;
  const newPrice = data.unitPrice ?? existing.unitPrice;
  const newAmount = newQty * newPrice;

  const updates: Record<string, unknown> = {};
  if (data.description !== undefined) updates.description = data.description;
  if (data.quantity !== undefined) updates.quantity = data.quantity;
  if (data.unitPrice !== undefined) updates.unitPrice = data.unitPrice;
  if (data.lineType !== undefined) updates.lineType = data.lineType;
  updates.amount = newAmount;

  const [updated] = await db
    .update(invoiceLineItems)
    .set(updates as Parameters<ReturnType<typeof db.update>['set']>[0])
    .where(eq(invoiceLineItems.id, lineId))
    .returning();

  await recalcInvoiceTotals(id);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id, lineId } = await params;

  const [existing] = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.id, lineId));
  if (!existing || existing.invoiceId !== id) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, lineId));
  await recalcInvoiceTotals(id);

  return NextResponse.json({ success: true });
}
