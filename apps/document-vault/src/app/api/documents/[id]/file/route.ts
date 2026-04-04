import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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

  const absolutePath = path.isAbsolute(doc.filePath)
    ? doc.filePath
    : path.join(process.cwd(), doc.filePath);

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const contentType = doc.mimeType || 'application/octet-stream';
  const disposition = `inline; filename="${encodeURIComponent(doc.originalName)}"`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': disposition,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
