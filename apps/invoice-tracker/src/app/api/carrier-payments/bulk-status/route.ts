import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

const BulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
  status: z.enum(['pending', 'approved', 'paid', 'disputed']),
  paidDate: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BulkStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, status, paidDate, referenceNumber } = parsed.data;

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'paid') {
    updates.paidDate = paidDate ?? new Date().toISOString().split('T')[0];
    if (referenceNumber) updates.referenceNumber = referenceNumber;
  }

  await db
    .update(carrierPayments)
    .set(updates)
    .where(inArray(carrierPayments.id, ids));

  return NextResponse.json({ success: true, updated: ids.length });
}
