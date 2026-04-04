import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deductionTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  is_percentage: z.boolean().optional(),
  category: z.enum(['insurance', 'lease', 'eld', 'fuel_advance', 'toll', 'ticket', 'repair', 'other']).optional(),
  frequency: z.enum(['per_settlement', 'monthly']).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [updated] = await db
      .update(deductionTemplates)
      .set(parsed.data)
      .where(eq(deductionTemplates.id, templateId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ template: updated });
  } catch (err) {
    console.error('PATCH template error:', err);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  if (isNaN(templateId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await db.delete(deductionTemplates).where(eq(deductionTemplates.id, templateId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE template error:', err);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
