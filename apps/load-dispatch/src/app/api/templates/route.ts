import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loadTemplates } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const templates = await db.select().from(loadTemplates).orderBy(desc(loadTemplates.use_count));
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  const [template] = await db.insert(loadTemplates).values({
    ...body,
    created_at: now,
  }).returning();

  return NextResponse.json({ template }, { status: 201 });
}
