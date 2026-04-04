export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { shipments } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface CarrierRow {
  carrierName: string;
  count: number;
  cost: number;
  revenue: number;
  margin: number;
  onTimeDeliveries: number;
  totalWithDeliveryData: number;
}

async function getCarriers(): Promise<CarrierRow[]> {
  const all = await db
    .select()
    .from(shipments)
    .where(isNotNull(shipments.carrierName));

  const map: Record<string, CarrierRow> = {};
  for (const s of all) {
    if (!s.carrierName) continue;
    const r = map[s.carrierName] ?? {
      carrierName: s.carrierName,
      count: 0,
      cost: 0,
      revenue: 0,
      margin: 0,
      onTimeDeliveries: 0,
      totalWithDeliveryData: 0,
    };
    r.count += 1;
    r.cost += s.carrierRate ?? 0;
    r.revenue += s.customerRate ?? 0;
    r.margin += s.margin ?? 0;
    if (s.deliveryOnTime !== null) {
      r.totalWithDeliveryData += 1;
      if (s.deliveryOnTime === true) r.onTimeDeliveries += 1;
    }
    map[s.carrierName] = r;
  }

  return Object.values(map).sort((a, b) => b.count - a.count);
}

export default async function CarriersPage() {
  const carriers = await getCarriers();

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Carriers</h1>
        <p className="text-[#8B95A5] text-sm mt-1">{carriers.length} carriers</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#8B95A5]">Carrier</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Shipments</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Total Cost</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">Avg Margin</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[#8B95A5]">On-Time %</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((c) => {
              const marginPct = c.revenue > 0 ? (c.margin / c.revenue) * 100 : null;
              const onTimePct = c.totalWithDeliveryData > 0
                ? (c.onTimeDeliveries / c.totalWithDeliveryData) * 100
                : null;
              return (
                <tr key={c.carrierName} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/shipments?carrier=${encodeURIComponent(c.carrierName)}`}
                      className="text-white font-medium hover:text-[#00C650] hover:underline"
                    >
                      {c.carrierName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-[#8B95A5]">{c.count}</td>
                  <td className="px-4 py-3 text-right text-white">{formatCurrency(c.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    {marginPct != null ? (
                      <span className={marginPct >= 20 ? 'text-green-400 font-semibold' : marginPct >= 12 ? 'text-yellow-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {marginPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onTimePct != null ? (
                      <span className={onTimePct >= 90 ? 'text-green-400 font-semibold' : onTimePct >= 75 ? 'text-yellow-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {onTimePct.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-[#8B95A5]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
