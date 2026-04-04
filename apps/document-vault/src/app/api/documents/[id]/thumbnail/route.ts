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

  if (doc.thumbnailPath) {
    const absolutePath = path.isAbsolute(doc.thumbnailPath)
      ? doc.thumbnailPath
      : path.join(process.cwd(), doc.thumbnailPath);

    if (fs.existsSync(absolutePath)) {
      const buffer = fs.readFileSync(absolutePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  }

  // No thumbnail — return 404 so clients know to show placeholder
  return NextResponse.json({ error: 'No thumbnail' }, { status: 404 });
}
