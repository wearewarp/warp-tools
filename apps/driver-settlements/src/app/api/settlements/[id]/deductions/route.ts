import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlementDeductions, settlements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recalculateSettlement } from '@/lib/recalculate';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const DeductionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  deduction_type: z.enum(['recurring', 'one_time']).default('one_time'),
  category: z.enum(['insurance', 'lease', 'eld', 'fuel_advance', 'toll', 'ticket', 'repair', 'other']).default('other'),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
    if (!settlement) return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });

    const body = await req.json();
    const parsed = DeductionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [deduction] = await db
      .insert(settlementDeductions)
      .values({ settlement_id: settlementId, ...parsed.data })
      .returning();

    await recalculateSettlement(settlementId);

    return NextResponse.json({ deduction }, { status: 201 });
  } catch (err) {
    console.error('POST /api/settlements/[id]/deductions error:', err);
    return NextResponse.json({ error: 'Failed to add deduction' }, { status: 500 });
  }
}
