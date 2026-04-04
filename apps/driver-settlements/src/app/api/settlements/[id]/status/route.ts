import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlements, advances } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recalculateSettlement } from '@/lib/recalculate';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const StatusSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('submit') }),
  z.object({
    action: z.literal('approve'),
    approved_by: z.string().min(1),
  }),
  z.object({
    action: z.literal('pay'),
    payment_method: z.enum(['check', 'ach', 'wire']),
    payment_reference: z.string().min(1),
  }),
  z.object({
    action: z.literal('dispute'),
    disputed_reason: z.string().min(1),
  }),
  z.object({ action: z.literal('reopen') }),
]);

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
    if (!settlement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const now = new Date().toISOString();
    let updateData: Partial<typeof settlements.$inferInsert> = { updated_at: now };

    switch (parsed.data.action) {
      case 'submit':
        if (settlement.status !== 'open' && settlement.status !== 'disputed') {
          return NextResponse.json({ error: 'Can only submit open or disputed settlements' }, { status: 400 });
        }
        updateData.status = 'submitted';
        updateData.disputed_reason = null;
        break;

      case 'approve':
        if (settlement.status !== 'submitted') {
          return NextResponse.json({ error: 'Can only approve submitted settlements' }, { status: 400 });
        }
        updateData.status = 'approved';
        updateData.approved_by = parsed.data.approved_by;
        updateData.approved_at = now;
        break;

      case 'pay':
        if (settlement.status !== 'approved') {
          return NextResponse.json({ error: 'Can only pay approved settlements' }, { status: 400 });
        }
        updateData.status = 'paid';
        updateData.paid_date = now.split('T')[0];
        updateData.payment_method = parsed.data.payment_method;
        updateData.payment_reference = parsed.data.payment_reference;

        // Mark all linked advances as deducted
        await db
          .update(advances)
          .set({ status: 'deducted' })
          .where(eq(advances.settlement_id, settlementId));
        break;

      case 'dispute':
        if (settlement.status === 'paid') {
          return NextResponse.json({ error: 'Cannot dispute a paid settlement' }, { status: 400 });
        }
        updateData.status = 'disputed';
        updateData.disputed_reason = parsed.data.disputed_reason;
        break;

      case 'reopen':
        if (settlement.status === 'paid') {
          return NextResponse.json({ error: 'Cannot reopen a paid settlement' }, { status: 400 });
        }
        updateData.status = 'open';
        updateData.disputed_reason = null;
        break;
    }

    // Recalculate totals before persisting
    await recalculateSettlement(settlementId);

    const [updated] = await db
      .update(settlements)
      .set(updateData)
      .where(eq(settlements.id, settlementId))
      .returning();

    return NextResponse.json({ settlement: updated });
  } catch (err) {
    console.error('POST /api/settlements/[id]/status error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
