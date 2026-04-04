export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { lanes, carrier_rates, customer_tariffs, rfqs } from '@/db/schema';
import { eq, count, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import {
  Map,
  DollarSign,
  FileQuestion,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export default async function DashboardPage() {
  const [laneCount] = await db.select({ count: count() }).from(lanes).where(eq(lanes.status, 'active'));
  const [rateCount] = await db.select({ count: count() }).from(carrier_rates);
  const [tariffCount] = await db.select({ count: count() }).from(customer_tariffs).where(eq(customer_tariffs.status, 'active'));
  const [rfqCount] = await db.select({ count: count() }).from(rfqs);

  const activeRFQs = await db.select({ count: count() }).from(rfqs).where(sql`status IN ('sent','responses')`);
  const awardedRFQs = await db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, 'awarded'));

  const recentRFQs = await db.select().from(rfqs).orderBy(sql`created_at DESC`).limit(5);
  const recentRates = await db.select().from(carrier_rates).orderBy(sql`created_at DESC`).limit(5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Rate Management</h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Track carrier rates, customer tariffs, and RFQs across your freight network.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2">
            <Map className="h-4 w-4" />
            Active Lanes
          </div>
          <div className="text-2xl font-bold text-white">{laneCount.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2">
            <DollarSign className="h-4 w-4" />
            Carrier Rates
          </div>
          <div className="text-2xl font-bold text-white">{rateCount.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2">
            <TrendingUp className="h-4 w-4" />
            Customer Tariffs
          </div>
          <div className="text-2xl font-bold text-white">{tariffCount.count}</div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4">
          <div className="flex items-center gap-2 text-[#8B95A5] text-xs mb-2">
            <FileQuestion className="h-4 w-4" />
            Total RFQs
          </div>
          <div className="text-2xl font-bold text-white">{rfqCount.count}</div>
        </div>
      </div>

      {/* RFQ Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10 border border-blue-400/20 flex-shrink-0">
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm text-[#8B95A5]">Active RFQs</div>
            <div className="text-xl font-bold text-white">{activeRFQs[0].count}</div>
          </div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/10 border border-green-400/20 flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <div className="text-sm text-[#8B95A5]">Awarded</div>
            <div className="text-xl font-bold text-white">{awardedRFQs[0].count}</div>
          </div>
        </div>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-sm text-[#8B95A5]">Expiring Rates</div>
            <div className="text-xl font-bold text-white">3</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-[#00C650]" />
              Recent RFQs
            </h2>
            <a href="/rfqs" className="text-xs text-[#00C650] hover:underline">View all</a>
          </div>
          <div className="space-y-2">
            {recentRFQs.map(rfq => (
              <div key={rfq.id} className="flex items-center justify-between py-2 border-b border-[#1A2235] last:border-0">
                <div>
                  <div className="text-sm font-medium text-white">{rfq.rfq_number}</div>
                  <div className="text-xs text-[#8B95A5] flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {rfq.pickup_date ?? '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8B95A5]">{rfq.equipment_type?.replace('_', ' ')}</div>
                  <div className="text-xs font-medium mt-0.5">
                    {rfq.desired_rate ? formatCurrency(rfq.desired_rate) : '—'}
                  </div>
                </div>
              </div>
            ))}
            {recentRFQs.length === 0 && (
              <p className="text-sm text-[#8B95A5] py-4 text-center">No RFQs yet</p>
            )}
          </div>
        </div>

        {/* Recent Carrier Rates */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#00C650]" />
              Recent Carrier Rates
            </h2>
            <a href="/lanes" className="text-xs text-[#00C650] hover:underline">View lanes</a>
          </div>
          <div className="space-y-2">
            {recentRates.map(rate => (
              <div key={rate.id} className="flex items-center justify-between py-2 border-b border-[#1A2235] last:border-0">
                <div>
                  <div className="text-sm font-medium text-white">{rate.carrier_name}</div>
                  <div className="text-xs text-[#8B95A5] mt-0.5">{rate.rate_type} · {rate.source ?? '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {formatCurrency(rate.rate_amount)}
                  </div>
                  <div className="text-xs text-[#8B95A5] mt-0.5">{rate.rate_basis.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
            {recentRates.length === 0 && (
              <p className="text-sm text-[#8B95A5] py-4 text-center">No rates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
