import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import type { DocType } from '@/db/schema';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Related docs: same load_ref, different id
  let related: typeof documents.$inferSelect[] = [];
  if (doc.loadRef) {
    related = await db
      .select()
      .from(documents)
      .where(and(eq(documents.loadRef, doc.loadRef), ne(documents.id, id)))
      .limit(6);
  }

  return NextResponse.json({ ...doc, related });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [existing] = await db.select().from(documents).where(eq(documents.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const allowed = [
    'docType', 'loadRef', 'carrierId', 'carrierName', 'customerId', 'customerName',
    'documentDate', 'expiryDate', 'tags', 'notes', 'uploadedBy',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate docType if provided
  if (updates.docType) {
    const validTypes: DocType[] = [
      'bol', 'pod', 'rate_confirmation', 'invoice', 'insurance_cert',
      'authority_letter', 'customs_declaration', 'weight_certificate', 'lumper_receipt', 'other',
    ];
    if (!validTypes.includes(updates.docType as DocType)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(documents)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(documents.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const [existing] = await db.select().from(documents).where(eq(documents.id, id));
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db
    .update(documents)
    .set({ status: 'archived', updatedAt: new Date().toISOString() })
    .where(eq(documents.id, id));

  return NextResponse.json({ success: true });
}
