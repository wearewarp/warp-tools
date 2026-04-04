export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { drivers, settlements, trips, advances } from '@/db/schema';
import { eq, count, sum, and } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { Users, FileText, DollarSign, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

async function getDashboardData() {
  const [activeDriversResult] = await db
    .select({ count: count() })
    .from(drivers)
    .where(eq(drivers.status, 'active'));

  const [openSettlementsResult] = await db
    .select({ count: count() })
    .from(settlements)
    .where(eq(settlements.status, 'open'));

  const [submittedSettlementsResult] = await db
    .select({ count: count() })
    .from(settlements)
    .where(eq(settlements.status, 'submitted'));

  const [pendingPayResult] = await db
    .select({ total: sum(settlements.net_pay) })
    .from(settlements)
    .where(eq(settlements.status, 'approved'));

  const [outstandingAdvancesResult] = await db
    .select({ total: sum(advances.amount) })
    .from(advances)
    .where(eq(advances.status, 'outstanding'));

  const recentSettlements = await db
    .select({
      id: settlements.id,
      settlement_number: settlements.settlement_number,
      status: settlements.status,
      net_pay: settlements.net_pay,
      period_end: settlements.period_end,
      driver_first: drivers.first_name,
      driver_last: drivers.last_name,
    })
    .from(settlements)
    .innerJoin(drivers, eq(settlements.driver_id, drivers.id))
    .orderBy(settlements.id)
    .limit(5);

  const [totalTripsResult] = await db
    .select({ count: count() })
    .from(trips);

  return {
    activeDrivers: activeDriversResult?.count ?? 0,
    openSettlements: openSettlementsResult?.count ?? 0,
    submittedSettlements: submittedSettlementsResult?.count ?? 0,
    pendingPay: Number(pendingPayResult?.total ?? 0),
    outstandingAdvances: Number(outstandingAdvancesResult?.total ?? 0),
    recentSettlements,
    totalTrips: totalTripsResult?.count ?? 0,
  };
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-slate-400 bg-slate-400/10',
  submitted: 'text-yellow-400 bg-yellow-400/10',
  approved: 'text-blue-400 bg-blue-400/10',
  paid: 'text-green-400 bg-green-400/10',
  disputed: 'text-red-400 bg-red-400/10',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  disputed: 'Disputed',
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Driver pay and settlement overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Active Drivers */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Active Drivers</span>
            <div className="h-8 w-8 rounded-lg bg-[#00C650]/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-[#00C650]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{data.activeDrivers}</div>
          <div className="text-xs text-[#8B95A5] mt-1">{data.totalTrips} trips recorded</div>
        </div>

        {/* Open Settlements */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Open Settlements</span>
            <div className="h-8 w-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{data.openSettlements}</div>
          <div className="text-xs text-[#8B95A5] mt-1">{data.submittedSettlements} awaiting approval</div>
        </div>

        {/* Pending Pay */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Approved, Pending Pay</span>
            <div className="h-8 w-8 rounded-lg bg-[#00C650]/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#00C650]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(data.pendingPay)}</div>
          <div className="text-xs text-[#8B95A5] mt-1">Ready to pay out</div>
        </div>

        {/* Outstanding Advances */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Outstanding Advances</span>
            <div className="h-8 w-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(data.outstandingAdvances)}</div>
          <div className="text-xs text-[#8B95A5] mt-1">Not yet deducted</div>
        </div>

        {/* Submitted */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Awaiting Review</span>
            <div className="h-8 w-8 rounded-lg bg-yellow-400/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{data.submittedSettlements}</div>
          <div className="text-xs text-[#8B95A5] mt-1">Submitted settlements</div>
        </div>

        {/* Quick action */}
        <div className="rounded-xl bg-[#00C650]/5 border border-[#00C650]/20 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8B95A5]">Process Settlements</span>
            <div className="h-8 w-8 rounded-lg bg-[#00C650]/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#00C650]" />
            </div>
          </div>
          <div>
            <p className="text-xs text-[#8B95A5] mb-3">Review and approve pending driver settlements.</p>
            <a
              href="/settlements"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00C650] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00C650]/90 transition-colors"
            >
              View Settlements
            </a>
          </div>
        </div>
      </div>

      {/* Recent Settlements */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Recent Settlements</h2>
        </div>
        <div className="divide-y divide-[#1A2235]">
          {data.recentSettlements.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">No settlements yet.</div>
          ) : (
            data.recentSettlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#0C1528] transition-colors">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{s.settlement_number}</div>
                    <div className="text-xs text-[#8B95A5]">{s.driver_first} {s.driver_last}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? 'text-slate-400 bg-slate-400/10'}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">{formatCurrency(s.net_pay)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
