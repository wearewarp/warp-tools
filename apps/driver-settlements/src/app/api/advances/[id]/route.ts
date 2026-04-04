import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advances } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { AdvanceStatus } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const advanceId = parseInt(id, 10);

  try {
    const body = await req.json();

    const updateData: { status?: AdvanceStatus; reason?: string; amount?: number } = {};

    if (body.action === 'forgive') {
      updateData.status = 'forgiven';
    } else if (body.status) {
      updateData.status = body.status as AdvanceStatus;
    }

    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);

    const [updated] = await db
      .update(advances)
      .set(updateData)
      .where(eq(advances.id, advanceId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/advances/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}
