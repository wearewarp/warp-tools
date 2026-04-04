import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settlements, settlementDeductions } from '@/db/schema';
import { gte, lte, and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';

  try {
    const filters = [];
    if (dateFrom) filters.push(gte(settlements.period_start, dateFrom));
    if (dateTo) filters.push(lte(settlements.period_end, dateTo));

    const settlementsData = filters.length > 0
      ? await db.select({ id: settlements.id }).from(settlements).where(and(...filters))
      : await db.select({ id: settlements.id }).from(settlements);

    const settlementIds = settlementsData.map((s) => s.id);

    if (settlementIds.length === 0) {
      return NextResponse.json({ report: [], date_from: dateFrom, date_to: dateTo });
    }

    const allDeductions = await db.select().from(settlementDeductions);
    const filtered = allDeductions.filter((d) => settlementIds.includes(d.settlement_id));

    // Group by category
    const byCategory = new Map<string, { count: number; total: number }>();
    for (const d of filtered) {
      const existing = byCategory.get(d.category) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += d.amount;
      byCategory.set(d.category, existing);
    }

    const report = Array.from(byCategory.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: Math.round(data.total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ report, date_from: dateFrom, date_to: dateTo });
  } catch (err) {
    console.error('GET /api/reports/deduction-breakdown error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
