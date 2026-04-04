import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { and, gte, lte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    const conditions = [];
    if (from) conditions.push(gte(appointments.scheduled_date, from));
    if (to) conditions.push(lte(appointments.scheduled_date, to));

    const rows = await db
      .select()
      .from(appointments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const byCarrier = new Map<string, { total: number; noShows: number }>();
    for (const a of rows) {
      if (['cancelled'].includes(a.status)) continue; // exclude cancellations
      const key = a.carrier_name ?? 'Unknown';
      const existing = byCarrier.get(key) ?? { total: 0, noShows: 0 };
      byCarrier.set(key, {
        total: existing.total + 1,
        noShows: existing.noShows + (a.status === 'no_show' ? 1 : 0),
      });
    }

    const result = Array.from(byCarrier.entries())
      .map(([carrier, data]) => ({
        carrier,
        total: data.total,
        no_shows: data.noShows,
        no_show_rate: data.total > 0 ? Math.round((data.noShows / data.total) * 100) : 0,
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.no_show_rate - a.no_show_rate);

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
