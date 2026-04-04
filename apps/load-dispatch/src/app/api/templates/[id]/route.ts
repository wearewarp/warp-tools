import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loadTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [template] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, templateId)).limit(1);
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ template });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();

  await db.update(loadTemplates).set(body).where(eq(loadTemplates.id, templateId));

  const [updated] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, templateId)).limit(1);
  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  await db.delete(loadTemplates).where(eq(loadTemplates.id, templateId));
  return NextResponse.json({ success: true });
}
