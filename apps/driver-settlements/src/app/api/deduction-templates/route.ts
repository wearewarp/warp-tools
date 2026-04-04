import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { deductionTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const TemplateSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  is_percentage: z.boolean().default(false),
  category: z.enum(['insurance', 'lease', 'eld', 'fuel_advance', 'toll', 'ticket', 'repair', 'other']).default('other'),
  frequency: z.enum(['per_settlement', 'monthly']).default('per_settlement'),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const templates = await db.select().from(deductionTemplates).orderBy(deductionTemplates.id);
    return NextResponse.json({ templates });
  } catch (err) {
    console.error('GET /api/deduction-templates error:', err);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TemplateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [template] = await db.insert(deductionTemplates).values(parsed.data).returning();
    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error('POST /api/deduction-templates error:', err);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
