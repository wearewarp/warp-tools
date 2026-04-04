import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, checkCalls } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.load_id, loadId))
    .orderBy(checkCalls.created_at);

  return NextResponse.json({ load, checkCalls: calls });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const now = new Date().toISOString();

  await db
    .update(loads)
    .set({ ...body, updated_at: now })
    .where(eq(loads.id, loadId));

  const [updated] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  return NextResponse.json({ load: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await db.delete(loads).where(eq(loads.id, loadId));
  return NextResponse.json({ success: true });
}
