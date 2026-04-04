export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  formatCurrency,
  getEquipmentLabel,
  getRateBasisLabel,
  getRateTypeColor,
  getRateTypeLabel,
  getTariffStatusColor,
  getTariffStatusLabel,
  calculateMargin,
  getMarginColor,
  cn,
} from '@/lib/utils';
import { BarChart2, ArrowRight, TrendingUp } from 'lucide-react';

export default async function ComparePage() {
  const activeLanes = await db.select().from(lanes).where(eq(lanes.status, 'active'));

  const laneData = await Promise.all(
    activeLanes.map(async lane => {
      const rates = await db.select().from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount);
      const tariffs = await db.select().from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));
      return { lane, rates, tariffs };
    })
  );

  // Only show lanes that have both rates and tariffs for comparison
  const comparableLanes = laneData.filter(d => d.rates.length > 0 && d.tariffs.length > 0);
  const ratesOnlyLanes = laneData.filter(d => d.rates.length > 0 && d.tariffs.length === 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-[#00C650]" />
          Rate Comparison
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Compare carrier rates vs customer tariffs and track margins by lane.</p>
      </div>

      {comparableLanes.map(({ lane, rates, tariffs }) => {
        const bestCarrierRate = rates[0];
        const activeTariff = tariffs.find(t => t.status === 'active') ?? tariffs[0];
        const margin = activeTariff && bestCarrierRate
          ? calculateMargin(activeTariff.rate_amount, bestCarrierRate.rate_amount)
          : null;

        return (
          <div key={lane.id} className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
            {/* Lane Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span>{lane.origin_city}, {lane.origin_state}</span>
                    <ArrowRight className="h-4 w-4 text-[#8B95A5]" />
                    <span>{lane.dest_city}, {lane.dest_state}</span>
                  </div>
                  <div className="text-xs text-[#8B95A5] mt-0.5">{getEquipmentLabel(lane.equipment_type)} · {lane.estimated_miles?.toLocaleString()} mi</div>
                </div>
              </div>
              {margin !== null && (
                <div className="text-right">
                  <div className="text-xs text-[#8B95A5]">Est. Margin</div>
                  <div className={cn('text-lg font-bold flex items-center gap-1', getMarginColor(margin))}>
                    <TrendingUp className="h-4 w-4" />
                    {margin.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1A2235]">
              {/* Carrier Rates */}
              <div className="p-4">
                <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Carrier Rates ({rates.length})</div>
                <div className="space-y-2">
                  {rates.map(rate => (
                    <div key={rate.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <div className="text-sm text-white font-medium">{rate.carrier_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getRateTypeColor(rate.rate_type))}>
                            {getRateTypeLabel(rate.rate_type)}
                          </span>
                          <span className="text-xs text-[#8B95A5]">{getRateBasisLabel(rate.rate_basis)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{formatCurrency(rate.rate_amount)}</div>
                        {rate.expiry_date && (
                          <div className="text-xs text-[#8B95A5] mt-0.5">exp {rate.expiry_date}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Tariffs */}
              <div className="p-4">
                <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Customer Tariffs ({tariffs.length})</div>
                <div className="space-y-2">
                  {tariffs.map(tariff => (
                    <div key={tariff.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <div className="text-sm text-white font-medium">{tariff.customer_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border', getTariffStatusColor(tariff.status))}>
                            {getTariffStatusLabel(tariff.status)}
                          </span>
                          <span className="text-xs text-[#8B95A5]">{getRateBasisLabel(tariff.rate_basis)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{formatCurrency(tariff.rate_amount)}</div>
                        {tariff.contract_ref && (
                          <div className="text-xs text-[#8B95A5] mt-0.5">{tariff.contract_ref}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {ratesOnlyLanes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[#8B95A5] mb-3">Lanes with Rates Only (no tariff)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ratesOnlyLanes.map(({ lane, rates }) => (
              <div key={lane.id} className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
                <div className="flex items-center gap-1 text-sm text-white font-medium mb-2">
                  <span>{lane.origin_city}</span>
                  <ArrowRight className="h-3 w-3 text-[#8B95A5]" />
                  <span>{lane.dest_city}</span>
                </div>
                <div className="text-xs text-[#8B95A5]">{rates.length} carrier rate{rates.length !== 1 ? 's' : ''}</div>
                <div className="text-xs text-yellow-400 mt-1">No tariff set — add one to track margin</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparableLanes.length === 0 && ratesOnlyLanes.length === 0 && (
        <div className="text-center py-20 text-[#8B95A5]">
          <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No data to compare yet</p>
          <p className="text-sm mt-1">Add carrier rates and customer tariffs to lanes to see comparisons.</p>
        </div>
      )}
    </div>
  );
}
