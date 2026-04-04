import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads } from '@/db/schema';
import { like, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json({ loads: [] });
  }

  const results = await db
    .select()
    .from(loads)
    .where(
      or(
        like(loads.load_number, `%${q}%`),
        like(loads.customer_name, `%${q}%`),
        like(loads.carrier_name, `%${q}%`),
        like(loads.origin_city, `%${q}%`),
        like(loads.dest_city, `%${q}%`),
        like(loads.origin_state, `%${q}%`),
        like(loads.dest_state, `%${q}%`),
        like(loads.commodity, `%${q}%`),
        like(loads.customer_ref, `%${q}%`),
        like(loads.bol_number, `%${q}%`),
      )
    )
    .limit(10);

  return NextResponse.json({ loads: results });
}
