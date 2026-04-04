import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { DocType } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ids, updates } = body as {
    ids: string[];
    updates: {
      docType?: DocType;
      loadRef?: string;
      carrierName?: string;
      customerName?: string;
      tags?: string;
    };
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (updates.docType) patch.docType = updates.docType;
  if (updates.loadRef !== undefined) patch.loadRef = updates.loadRef;
  if (updates.carrierName !== undefined) patch.carrierName = updates.carrierName;
  if (updates.customerName !== undefined) patch.customerName = updates.customerName;
  if (updates.tags !== undefined) patch.tags = updates.tags;

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
  }

  if (ids.length === 1) {
    await db.update(documents).set(patch).where(eq(documents.id, ids[0]));
  } else {
    await db.update(documents).set(patch).where(inArray(documents.id, ids));
  }

  return NextResponse.json({ updated: ids.length });
}
