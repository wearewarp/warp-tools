import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Generate a new load number
  const [latest] = await db.select().from(loads).orderBy(desc(loads.id)).limit(1);
  const lastNum = latest ? parseInt(latest.load_number.replace(/\D/g, ''), 10) : 10000;
  const newLoadNumber = `WLD-${String(lastNum + 1).padStart(5, '0')}`;

  const now = new Date().toISOString();

  const { id: _id, created_at, updated_at, posted_at, covered_at, dispatched_at,
    picked_up_at, delivered_at, invoiced_at, closed_at, cancelled_at,
    cancellation_reason, carrier_name, carrier_contact, carrier_phone,
    carrier_email, carrier_rate, carrier_id, margin, margin_pct,
    bol_number, pro_number, ...copyFields } = load;

  const [newLoad] = await db
    .insert(loads)
    .values({
      ...copyFields,
      load_number: newLoadNumber,
      status: 'new',
      created_at: now,
      updated_at: now,
    })
    .returning();

  return NextResponse.json({ load: newLoad }, { status: 201 });
}
