import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { z } from 'zod';

const BulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one invoice ID required'),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void']),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BulkStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, status } = parsed.data;

  const updated = await db
    .update(invoices)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(inArray(invoices.id, ids))
    .returning();

  return NextResponse.json({ updated: updated.length, invoices: updated });
}
