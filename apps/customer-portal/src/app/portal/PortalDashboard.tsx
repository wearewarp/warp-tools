'use client';

import Link from 'next/link';
import { Package, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PortalShipment {
  id: string;
  shipmentNumber: string;
  status: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  currentLocationCity: string | null;
  currentLocationState: string | null;
  currentEta: string | null;
  equipmentType: string | null;
  commodity: string | null;
  specialInstructions: string | null;
  createdAt: string | null;
  docCount: number;
}

interface PortalDashboardProps {
  customer: { id: string; name: string };
  shipments: PortalShipment[];
  unreadCount: number;
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

export function PortalDashboard({ customer, shipments }: PortalDashboardProps) {
  const active = shipments.filter((s) => !['closed', 'cancelled', 'delivered', 'invoiced'].includes(s.status));

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome, {customer.name}</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Track and manage your shipments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <p className="text-xs text-[#8B95A5] mb-1">Total Shipments</p>
          <p className="text-2xl font-bold text-white">{shipments.length}</p>
        </div>
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <p className="text-xs text-[#8B95A5] mb-1">Active</p>
          <p className="text-2xl font-bold text-[#00C650]">{active.length}</p>
        </div>
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <p className="text-xs text-[#8B95A5] mb-1">Delivered</p>
          <p className="text-2xl font-bold text-white">{shipments.filter((s) => s.status === 'delivered').length}</p>
        </div>
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00C650]/10 border border-[#00C650]/20">
            <Package className="h-8 w-8 text-[#00C650]" />
          </div>
          <h2 className="text-lg font-semibold text-white">No Shipments</h2>
          <p className="mt-2 text-sm text-[#8B95A5]">Your shipments will appear here once they&apos;re created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Your Shipments</h2>
          {shipments.map((s) => (
            <Link
              key={s.id}
              href={`/portal/shipments/${s.id}`}
              className="block rounded-xl border border-[#1A2235] bg-[#080F1E] p-4 hover:bg-[#0C1528] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[#00C650] text-sm font-medium">{s.shipmentNumber}</span>
                    <span className={`inline-flex items-center border rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? STATUS_COLORS.booked}`}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                    {s.docCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
                        <FileText className="h-3 w-3" />
                        {s.docCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white">
                    {s.originCity}, {s.originState} → {s.destCity}, {s.destState}
                  </p>
                  {s.commodity && <p className="text-xs text-[#8B95A5] mt-0.5">{s.commodity}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#8B95A5]">Pickup: {formatDate(s.pickupDate)}</p>
                  <p className="text-xs text-[#8B95A5]">Delivery: {formatDate(s.deliveryDate)}</p>
                  {s.currentEta && (
                    <p className="text-xs text-amber-400 mt-0.5">ETA: {formatDate(s.currentEta)}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
