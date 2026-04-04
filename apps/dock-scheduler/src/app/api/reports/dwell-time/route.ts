import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    const conditions = [eq(appointments.status, 'completed')];
    if (from) conditions.push(gte(appointments.scheduled_date, from));
    if (to) conditions.push(lte(appointments.scheduled_date, to));

    const rows = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    // Group by carrier
    const byCarrier = new Map<string, { count: number; wait: number; dock: number; total: number }>();
    for (const a of rows) {
      const key = a.carrier_name ?? 'Unknown';
      const existing = byCarrier.get(key) ?? { count: 0, wait: 0, dock: 0, total: 0 };
      byCarrier.set(key, {
        count: existing.count + 1,
        wait: existing.wait + (a.wait_minutes ?? 0),
        dock: existing.dock + (a.dock_minutes ?? 0),
        total: existing.total + (a.total_dwell_minutes ?? 0),
      });
    }

    const result = Array.from(byCarrier.entries()).map(([carrier, data]) => ({
      carrier,
      count: data.count,
      avg_wait: Math.round(data.wait / data.count),
      avg_dock: Math.round(data.dock / data.count),
      avg_total: Math.round(data.total / data.count),
    }));

    result.sort((a, b) => b.avg_total - a.avg_total);

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
