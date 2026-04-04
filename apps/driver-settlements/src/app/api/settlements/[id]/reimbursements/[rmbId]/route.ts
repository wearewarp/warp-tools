import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlementReimbursements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recalculateSettlement } from '@/lib/recalculate';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; rmbId: string }> };

const PatchSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.enum(['fuel', 'toll', 'maintenance', 'supplies', 'other']).optional(),
  receipt_ref: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id, rmbId } = await params;
  const settlementId = parseInt(id, 10);
  const reimbursementId = parseInt(rmbId, 10);
  if (isNaN(settlementId) || isNaN(reimbursementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [updated] = await db
      .update(settlementReimbursements)
      .set(parsed.data)
      .where(eq(settlementReimbursements.id, reimbursementId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await recalculateSettlement(settlementId);
    return NextResponse.json({ reimbursement: updated });
  } catch (err) {
    console.error('PATCH reimbursement error:', err);
    return NextResponse.json({ error: 'Failed to update reimbursement' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id, rmbId } = await params;
  const settlementId = parseInt(id, 10);
  const reimbursementId = parseInt(rmbId, 10);
  if (isNaN(settlementId) || isNaN(reimbursementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await db.delete(settlementReimbursements).where(eq(settlementReimbursements.id, reimbursementId));
    await recalculateSettlement(settlementId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE reimbursement error:', err);
    return NextResponse.json({ error: 'Failed to delete reimbursement' }, { status: 500 });
  }
}
