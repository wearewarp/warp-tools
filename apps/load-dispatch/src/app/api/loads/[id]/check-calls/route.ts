import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { checkCalls } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const calls = await db
    .select()
    .from(checkCalls)
    .where(eq(checkCalls.load_id, loadId))
    .orderBy(asc(checkCalls.created_at));

  return NextResponse.json({ checkCalls: calls });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const { status, location_city, location_state, eta, notes, contact_method, called_by } = body;

  if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const [created] = await db
    .insert(checkCalls)
    .values({
      load_id: loadId,
      status,
      location_city: location_city ?? null,
      location_state: location_state ?? null,
      eta: eta ?? null,
      notes: notes ?? null,
      contact_method: contact_method ?? 'phone',
      called_by: called_by ?? null,
    })
    .returning();

  return NextResponse.json({ checkCall: created }, { status: 201 });
}
