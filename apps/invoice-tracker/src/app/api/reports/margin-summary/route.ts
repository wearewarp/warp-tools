import { NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, customers } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const allLoads = await db.select().from(loads);
  const allCustomers = await db.select().from(customers);
  const customerMap = new Map(allCustomers.map((c) => [c.id, c.name]));

  const totalRevenue = allLoads.reduce((sum, l) => sum + (l.revenue ?? 0), 0);
  const totalCost = allLoads.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const totalMargin = totalRevenue - totalCost;
  const avgMarginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

  // Per-customer margin
  const byCustomer = new Map<string, { name: string; revenue: number; cost: number; loadCount: number }>();
  for (const l of allLoads) {
    const key = l.customerId ?? 'unknown';
    if (!byCustomer.has(key)) {
      byCustomer.set(key, { name: customerMap.get(key) ?? 'Unknown', revenue: 0, cost: 0, loadCount: 0 });
    }
    const row = byCustomer.get(key)!;
    row.revenue += l.revenue ?? 0;
    row.cost += l.cost ?? 0;
    row.loadCount += 1;
  }

  const customerMargins = Array.from(byCustomer.values()).map((c) => ({
    ...c,
    margin: c.revenue - c.cost,
    marginPct: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0,
  })).sort((a, b) => b.margin - a.margin);

  // Per-carrier margin
  const byCarrier = new Map<string, { name: string; revenue: number; cost: number; loadCount: number }>();
  for (const l of allLoads) {
    const key = l.carrierId ?? l.carrierName ?? 'unknown';
    if (!byCarrier.has(key)) {
      byCarrier.set(key, { name: l.carrierName ?? 'Unknown', revenue: 0, cost: 0, loadCount: 0 });
    }
    const row = byCarrier.get(key)!;
    row.revenue += l.revenue ?? 0;
    row.cost += l.cost ?? 0;
    row.loadCount += 1;
  }

  const carrierMargins = Array.from(byCarrier.values()).map((c) => ({
    ...c,
    margin: c.revenue - c.cost,
    marginPct: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0,
  })).sort((a, b) => b.margin - a.margin);

  // Monthly trends (last 6 months)
  const now = new Date();
  const months: { month: string; revenue: number; cost: number; margin: number; marginPct: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const monthLoads = allLoads.filter((l) => l.pickupDate?.startsWith(monthKey) || l.createdAt?.startsWith(monthKey));
    const rev = monthLoads.reduce((s, l) => s + (l.revenue ?? 0), 0);
    const cost = monthLoads.reduce((s, l) => s + (l.cost ?? 0), 0);
    months.push({
      month: monthLabel,
      revenue: rev,
      cost,
      margin: rev - cost,
      marginPct: rev > 0 ? ((rev - cost) / rev) * 100 : 0,
    });
  }

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalCost,
      totalMargin,
      avgMarginPct: Math.round(avgMarginPct * 100) / 100,
      totalLoads: allLoads.length,
    },
    customerMargins,
    carrierMargins,
    monthlyTrends: months,
  });
}
