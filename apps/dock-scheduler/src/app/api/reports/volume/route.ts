import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments } from '@/db/schema';
import { and, gte, lte, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';

    const conditions = [
      ne(appointments.status, 'cancelled'),
      ne(appointments.status, 'no_show'),
    ];
    if (from) conditions.push(gte(appointments.scheduled_date, from));
    if (to) conditions.push(lte(appointments.scheduled_date, to));

    const rows = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    const byDate = new Map<string, { total: number; inbound: number; outbound: number }>();
    for (const a of rows) {
      const existing = byDate.get(a.scheduled_date) ?? { total: 0, inbound: 0, outbound: 0 };
      byDate.set(a.scheduled_date, {
        total: existing.total + 1,
        inbound: existing.inbound + (a.appointment_type === 'inbound' ? 1 : 0),
        outbound: existing.outbound + (a.appointment_type === 'outbound' ? 1 : 0),
      });
    }

    const result = Array.from(byDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
