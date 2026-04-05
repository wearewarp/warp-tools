import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { docId } = await params;

  const [doc] = await db
    .select()
    .from(portalDocuments)
    .where(eq(portalDocuments.id, docId));

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), doc.filePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.originalName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
