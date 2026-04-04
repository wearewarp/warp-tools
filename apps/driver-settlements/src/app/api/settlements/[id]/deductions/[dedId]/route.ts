import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlementDeductions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recalculateSettlement } from '@/lib/recalculate';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string; dedId: string }> };

const PatchSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  deduction_type: z.enum(['recurring', 'one_time']).optional(),
  category: z.enum(['insurance', 'lease', 'eld', 'fuel_advance', 'toll', 'ticket', 'repair', 'other']).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id, dedId } = await params;
  const settlementId = parseInt(id, 10);
  const deductionId = parseInt(dedId, 10);
  if (isNaN(settlementId) || isNaN(deductionId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [updated] = await db
      .update(settlementDeductions)
      .set(parsed.data)
      .where(eq(settlementDeductions.id, deductionId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await recalculateSettlement(settlementId);
    return NextResponse.json({ deduction: updated });
  } catch (err) {
    console.error('PATCH deduction error:', err);
    return NextResponse.json({ error: 'Failed to update deduction' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id, dedId } = await params;
  const settlementId = parseInt(id, 10);
  const deductionId = parseInt(dedId, 10);
  if (isNaN(settlementId) || isNaN(deductionId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await db.delete(settlementDeductions).where(eq(settlementDeductions.id, deductionId));
    await recalculateSettlement(settlementId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE deduction error:', err);
    return NextResponse.json({ error: 'Failed to delete deduction' }, { status: 500 });
  }
}
