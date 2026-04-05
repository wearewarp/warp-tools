import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if ('isVisibleToCustomer' in body) updates.isVisibleToCustomer = body.isVisibleToCustomer;
  if ('notes' in body) updates.notes = body.notes;

  const [doc] = await db.update(portalDocuments).set(updates).where(eq(portalDocuments.id, docId)).returning();
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  return NextResponse.json({ document: doc });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;

  const [doc] = await db.select().from(portalDocuments).where(eq(portalDocuments.id, docId));
  if (doc) {
    // Try to delete the file
    try {
      const absPath = path.join(process.cwd(), doc.filePath);
      await fs.unlink(absPath);
    } catch {
      // ignore if file doesn't exist
    }
    await db.delete(portalDocuments).where(eq(portalDocuments.id, docId));
  }

  return NextResponse.json({ success: true });
}
