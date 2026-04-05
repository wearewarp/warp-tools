'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Search, Plus, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ShipmentRow {
  id: string;
  shipmentNumber: string;
  status: string;
  customerId: string | null;
  customerName: string | null;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  customerRate: number | null;
  createdAt: string | null;
  docCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  quote: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  booked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_transit: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  at_pickup: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  at_delivery: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
  invoiced: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  closed: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const ALL_STATUSES = ['quote', 'booked', 'in_transit', 'at_pickup', 'at_delivery', 'delivered', 'invoiced', 'closed', 'cancelled'];

export function ShipmentListClient({ shipments: initial }: { shipments: ShipmentRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const filtered = initial.filter((s) => {
    const matchSearch =
      !search ||
      s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      `${s.originCity}, ${s.originState}`.toLowerCase().includes(search.toLowerCase()) ||
      `${s.destCity}, ${s.destState}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (initial.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Shipments</h1>
            <p className="text-sm text-[#8B95A5] mt-1">Manage your shipments</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#00C650]/10 border border-[#00C650]/20">
            <Truck className="h-7 w-7 text-[#00C650]" />
          </div>
          <p className="text-sm text-[#8B95A5] mb-4">No shipments yet.</p>
          <Link
            href="/admin/shipments/new"
            className="inline-flex items-center gap-2 bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Shipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Shipments</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{initial.length} total shipments</p>
        </div>
        <Link
          href="/admin/shipments/new"
          className="inline-flex items-center gap-2 bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Shipment
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search shipments, customers, lanes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#040810] border border-[#1A2235] rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-white focus:border-[#00C650] outline-none"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Shipment #</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Lane</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Pickup</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Delivery</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Docs</th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`/admin/shipments/${s.id}`)}
                  className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[#00C650] text-xs">{s.shipmentNumber}</td>
                  <td className="px-4 py-3 text-slate-200">{s.customerName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200 text-xs">{s.originCity}, {s.originState} → {s.destCity}, {s.destState}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center border rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? STATUS_COLORS.booked}`}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8B95A5] text-xs">{formatDate(s.pickupDate)}</td>
                  <td className="px-4 py-3 text-[#8B95A5] text-xs">{formatDate(s.deliveryDate)}</td>
                  <td className="px-4 py-3">
                    {s.docCount > 0 ? (
                      <span className="flex items-center gap-1 text-[#8B95A5] text-xs">
                        <FileText className="h-3 w-3" />
                        {s.docCount}
                      </span>
                    ) : <span className="text-[#8B95A5]/40 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-white">
                    {s.customerRate ? `$${s.customerRate.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B95A5] text-sm">
                    No shipments match your search.
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
