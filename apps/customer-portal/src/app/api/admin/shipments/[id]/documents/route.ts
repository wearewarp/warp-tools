import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documents = await db
    .select()
    .from(portalDocuments)
    .where(eq(portalDocuments.shipmentId, id));
  return NextResponse.json({ documents });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as string || 'other';
    const notes = formData.get('notes') as string || '';
    const isVisibleToCustomer = formData.get('isVisibleToCustomer') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save file to uploads dir
    const uploadDir = path.join(process.cwd(), 'uploads', id);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const [doc] = await db
      .insert(portalDocuments)
      .values({
        id: crypto.randomUUID(),
        shipmentId: id,
        docType,
        filename,
        originalName: file.name,
        filePath: `/uploads/${id}/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        isVisibleToCustomer,
        notes: notes || null,
        uploadedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
