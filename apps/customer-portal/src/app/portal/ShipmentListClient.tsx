'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Package, Loader2 } from 'lucide-react';
import { ShipmentCard } from '@/components/portal/ShipmentCard';
import type { ShipmentStatus } from '@/db/schema';

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  poNumber: string | null;
  equipmentType: string | null;
  commodity: string | null;
  currentEta: string | null;
}

interface ShipmentListClientProps {
  customerName: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'booked', label: 'Booked' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'at_pickup', label: 'At Pickup' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'at_delivery', label: 'At Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ShipmentListClient({ customerName }: ShipmentListClientProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/portal/shipments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { shipments: Shipment[] };
        setShipments(data.shipments);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchShipments();
  }, [fetchShipments]);

  const emptyMessage = (search || statusFilter)
    ? 'Try adjusting your search or filter criteria.'
    : 'No shipments yet. Your broker will add shipments as they&apos;re booked.';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {customerName ? `${customerName}\u2019s Shipments` : 'Your Shipments'}
        </h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          Track and manage your freight shipments
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shipment # or PO#..."
            className="w-full rounded-lg border border-[#1A2235] bg-[#080F1E] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8B95A5] focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#1A2235] bg-[#080F1E] pl-10 pr-8 py-2.5 text-sm text-white focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650] appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#00C650]" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00C650]/10 border border-[#00C650]/20">
            <Package className="h-8 w-8 text-[#00C650]" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {(search || statusFilter) ? 'No shipments found' : 'No shipments yet'}
          </h2>
          <p className="mt-2 text-sm text-[#8B95A5] max-w-md mx-auto">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
          <p className="text-xs text-[#8B95A5] text-center pt-2">
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
