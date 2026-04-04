export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  formatCurrency,
  getEquipmentLabel,
  getEquipmentColor,
  getLaneStatusLabel,
  getLaneStatusColor,
  cn,
} from '@/lib/utils';
import { Map, ArrowRight } from 'lucide-react';

export default async function LanesPage() {
  const allLanes = await db.select().from(lanes).orderBy(sql`status ASC, created_at DESC`);

  const laneStats = await Promise.all(
    allLanes.map(async lane => {
      const [rateCount] = await db.select({ count: sql<number>`count(*)` }).from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id));
      const [tariffCount] = await db.select({ count: sql<number>`count(*)` }).from(customer_tariffs).where(eq(customer_tariffs.lane_id, lane.id));
      const bestRate = await db.select({ amount: carrier_rates.rate_amount, basis: carrier_rates.rate_basis }).from(carrier_rates).where(eq(carrier_rates.lane_id, lane.id)).orderBy(carrier_rates.rate_amount).limit(1);
      return { rateCount: rateCount.count, tariffCount: tariffCount.count, bestRate: bestRate[0] ?? null };
    })
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Map className="h-6 w-6 text-[#00C650]" />
            Lanes
          </h1>
          <p className="text-[#8B95A5] mt-1 text-sm">{allLanes.length} lanes in your network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {allLanes.map((lane, i) => {
          const stats = laneStats[i];
          const tags: string[] = lane.tags ? JSON.parse(lane.tags) : [];
          return (
            <div
              key={lane.id}
              className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5 hover:border-[#2A3245] transition-colors"
            >
              {/* Route */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span>{lane.origin_city}, {lane.origin_state}</span>
                    <ArrowRight className="h-4 w-4 text-[#8B95A5]" />
                    <span>{lane.dest_city}, {lane.dest_state}</span>
                  </div>
                  {lane.estimated_miles && (
                    <div className="text-xs text-[#8B95A5] mt-0.5">{lane.estimated_miles.toLocaleString()} mi</div>
                  )}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getLaneStatusColor(lane.status))}>
                  {getLaneStatusLabel(lane.status)}
                </span>
              </div>

              {/* Equipment */}
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', getEquipmentColor(lane.equipment_type))}>
                  {getEquipmentLabel(lane.equipment_type)}
                </span>
                {tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full border border-[#1A2235] text-[#8B95A5]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-sm border-t border-[#1A2235] pt-3">
                <div>
                  <div className="text-[#8B95A5] text-xs">Carrier Rates</div>
                  <div className="font-semibold text-white">{stats.rateCount}</div>
                </div>
                <div>
                  <div className="text-[#8B95A5] text-xs">Tariffs</div>
                  <div className="font-semibold text-white">{stats.tariffCount}</div>
                </div>
                {stats.bestRate && (
                  <div className="ml-auto text-right">
                    <div className="text-[#8B95A5] text-xs">Best Rate</div>
                    <div className="font-semibold text-[#00C650]">
                      {formatCurrency(stats.bestRate.amount)}
                      <span className="text-xs text-[#8B95A5] font-normal ml-1">/{stats.bestRate.basis.replace('per_', '')}</span>
                    </div>
                  </div>
                )}
              </div>

              {lane.notes && (
                <div className="mt-3 text-xs text-[#8B95A5] italic">{lane.notes}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
