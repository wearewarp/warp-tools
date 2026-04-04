import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlementReimbursements, settlements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { recalculateSettlement } from '@/lib/recalculate';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const ReimbursementSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(['fuel', 'toll', 'maintenance', 'supplies', 'other']).default('other'),
  receipt_ref: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
    if (!settlement) return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });

    const body = await req.json();
    const parsed = ReimbursementSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [reimbursement] = await db
      .insert(settlementReimbursements)
      .values({ settlement_id: settlementId, ...parsed.data })
      .returning();

    await recalculateSettlement(settlementId);

    return NextResponse.json({ reimbursement }, { status: 201 });
  } catch (err) {
    console.error('POST reimbursement error:', err);
    return NextResponse.json({ error: 'Failed to add reimbursement' }, { status: 500 });
  }
}
