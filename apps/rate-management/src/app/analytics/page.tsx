export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  formatCurrency,
  getEquipmentLabel,
  calculateMargin,
  getMarginColor,
  getMarginLabel,
  cn,
} from '@/lib/utils';
import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';

export default async function AnalyticsPage() {
  const activeLanes = await db.select().from(lanes).where(eq(lanes.status, 'active'));

  const laneMargins = await Promise.all(
    activeLanes.map(async lane => {
      const rates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount);
      const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));
      const bestRate = rates[0];
      const activeTariff = tariffs.find(t => t.status === 'active') ?? tariffs[0];
      const margin = bestRate && activeTariff ? calculateMargin(activeTariff.rate_amount, bestRate.rate_amount) : null;
      return { lane, bestRate, activeTariff, margin };
    })
  );

  const withMargin = laneMargins.filter(l => l.margin !== null);
  const thinMargins = withMargin.filter(l => l.margin! < 10);
  const healthyMargins = withMargin.filter(l => l.margin! >= 20);
  const avgMargin = withMargin.length > 0
    ? withMargin.reduce((acc, l) => acc + l.margin!, 0) / withMargin.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#00C650]" />
          Analytics
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Margin analysis and rate performance across your lane network.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="text-xs text-[#8B95A5] mb-1">Avg Margin</div>
          <div className={cn('text-2xl font-bold', getMarginColor(avgMargin))}>{avgMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="text-xs text-[#8B95A5] mb-1">Healthy Lanes ≥20%</div>
          <div className="text-2xl font-bold text-green-400">{healthyMargins.length}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="text-xs text-[#8B95A5] mb-1">Thin Margin &lt;10%</div>
          <div className="text-2xl font-bold text-red-400">{thinMargins.length}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="text-xs text-[#8B95A5] mb-1">Lanes Tracked</div>
          <div className="text-2xl font-bold text-white">{withMargin.length}</div>
        </div>
      </div>

      {/* Thin Margin Alert */}
      {thinMargins.length > 0 && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Margin Alert — {thinMargins.length} lane{thinMargins.length !== 1 ? 's' : ''} below 10%</span>
          </div>
          <div className="space-y-2">
            {thinMargins.map(({ lane, margin, bestRate, activeTariff }) => (
              <div key={lane.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-white">
                  <span>{lane.origin_city}</span>
                  <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                  <span>{lane.dest_city}</span>
                  <span className="text-[#8B95A5] ml-1">({getEquipmentLabel(lane.equipment_type)})</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#8B95A5]">Carrier: {bestRate ? formatCurrency(bestRate.rate_amount) : '—'}</span>
                  <span className="text-[#8B95A5]">Tariff: {activeTariff ? formatCurrency(activeTariff.rate_amount) : '—'}</span>
                  <span className="text-red-400 font-semibold">{margin?.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Lanes Table */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Lane Margin Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Lane</th>
                <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Equipment</th>
                <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium">Best Carrier Rate</th>
                <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium">Tariff Rate</th>
                <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2235]">
              {laneMargins
                .sort((a, b) => (a.margin ?? -999) - (b.margin ?? -999))
                .map(({ lane, bestRate, activeTariff, margin }) => (
                  <tr key={lane.id} className="hover:bg-[#0C1528] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-white font-medium">
                        <span>{lane.origin_city}, {lane.origin_state}</span>
                        <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                        <span>{lane.dest_city}, {lane.dest_state}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#8B95A5]">{getEquipmentLabel(lane.equipment_type)}</td>
                    <td className="px-4 py-3 text-right text-white">
                      {bestRate ? formatCurrency(bestRate.rate_amount) : <span className="text-[#8B95A5]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {activeTariff ? formatCurrency(activeTariff.rate_amount) : <span className="text-[#8B95A5]">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {margin !== null ? (
                        <span className={cn('font-semibold', getMarginColor(margin))}>
                          {margin.toFixed(1)}% <span className="text-xs font-normal">({getMarginLabel(margin)})</span>
                        </span>
                      ) : (
                        <span className="text-[#8B95A5]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
