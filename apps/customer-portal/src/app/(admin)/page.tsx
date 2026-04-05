import { db } from '@/db';
import { portalCustomers, portalShipments } from '@/db/schema';
import { Package, Users, Truck, MessageSquare, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const customers = await db.select().from(portalCustomers);
  const shipments = await db.select().from(portalShipments);

  const statusCounts: Record<string, number> = {};
  for (const s of shipments) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  return { customers, shipments, statusCounts };
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
      <div className="flex items-center gap-2 text-[#8B95A5] mb-1">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const { customers, shipments, statusCounts } = await getDashboardData();

  const activeShipments = shipments.filter(
    (s) => !['closed', 'cancelled', 'delivered', 'invoiced'].includes(s.status)
  ).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Manage customers, shipments, and portal settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Customers"
          value={customers.length}
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Total Shipments"
          value={shipments.length}
        />
        <StatCard
          icon={<Truck className="w-5 h-5" />}
          label="Active Shipments"
          value={activeShipments}
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="In Transit"
          value={statusCounts['in_transit'] ?? 0}
        />
      </div>

      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Shipments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#8B95A5] border-b border-[#1A2235]">
                <th className="text-left pb-3 font-medium">Shipment #</th>
                <th className="text-left pb-3 font-medium">Customer</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Origin</th>
                <th className="text-left pb-3 font-medium">Destination</th>
                <th className="text-right pb-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 10).map((s) => {
                const customer = customers.find((c) => c.id === s.customerId);
                return (
                  <tr key={s.id} className="border-b border-[#1A2235]/50 hover:bg-[#0C1528]">
                    <td className="py-3 font-mono text-[#00C650]">{s.shipmentNumber}</td>
                    <td className="py-3">{customer?.name ?? '—'}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#00C650]/10 text-[#00C650]">
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3">{s.originCity}, {s.originState}</td>
                    <td className="py-3">{s.destCity}, {s.destState}</td>
                    <td className="py-3 text-right font-mono">
                      {s.customerRate ? `$${s.customerRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                );
              })}
              {shipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8B95A5]">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00C650]/10 border border-[#00C650]/20">
                      <Shield className="h-6 w-6 text-[#00C650]" />
                    </div>
                    No shipments yet. Seed the database to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
