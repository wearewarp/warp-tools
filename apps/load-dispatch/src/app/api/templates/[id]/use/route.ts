import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loadTemplates, loads } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function generateLoadNumber(): string {
  const ts = Date.now().toString().slice(-6);
  return `WLD-${ts}`;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [template] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, templateId)).limit(1);
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Increment use_count
  await db
    .update(loadTemplates)
    .set({ use_count: sql`${loadTemplates.use_count} + 1` })
    .where(eq(loadTemplates.id, templateId));

  // Create a new load from template data
  const now = new Date().toISOString();
  const [newLoad] = await db.insert(loads).values({
    load_number: generateLoadNumber(),
    customer_id: template.customer_id ?? undefined,
    customer_name: template.customer_name ?? 'Unknown',
    status: 'new',
    origin_city: template.origin_city ?? '',
    origin_state: template.origin_state ?? '',
    dest_city: template.dest_city ?? '',
    dest_state: template.dest_state ?? '',
    equipment_type: template.equipment_type ?? 'dry_van',
    weight: template.weight ?? undefined,
    commodity: template.commodity ?? undefined,
    customer_rate: template.customer_rate ?? undefined,
    special_instructions: template.special_instructions ?? undefined,
    created_at: now,
    updated_at: now,
  }).returning();

  return NextResponse.json({ load: newLoad, templateData: template }, { status: 201 });
}
