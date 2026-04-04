import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { carrier_name, carrier_contact, carrier_phone, carrier_email, carrier_rate } = body;

  if (!carrier_name) return NextResponse.json({ error: 'carrier_name is required' }, { status: 400 });
  if (carrier_rate == null) return NextResponse.json({ error: 'carrier_rate is required' }, { status: 400 });

  const now = new Date().toISOString();
  const customerRate = load.customer_rate ?? 0;
  const carrierRateNum = parseFloat(carrier_rate);
  const margin = parseFloat((customerRate - carrierRateNum).toFixed(2));
  const marginPct = customerRate > 0 ? parseFloat(((margin / customerRate) * 100).toFixed(1)) : 0;

  await db
    .update(loads)
    .set({
      carrier_name,
      carrier_contact: carrier_contact ?? null,
      carrier_phone: carrier_phone ?? null,
      carrier_email: carrier_email ?? null,
      carrier_rate: carrierRateNum,
      margin,
      margin_pct: marginPct,
      status: 'covered',
      covered_at: now,
      updated_at: now,
    })
    .where(eq(loads.id, loadId));

  const [updated] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  return NextResponse.json({ load: updated });
}
