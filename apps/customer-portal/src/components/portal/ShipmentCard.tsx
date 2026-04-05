import Link from 'next/link';
import { ArrowRight, Calendar, Package } from 'lucide-react';
import type { ShipmentStatus } from '@/db/schema';

const STATUS_LABELS: Record<string, string> = {
  quote: 'Quote',
  booked: 'Booked',
  dispatched: 'Dispatched',
  at_pickup: 'At Pickup',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  quote: 'text-[#8B95A5] bg-[#8B95A5]/10 border-[#8B95A5]/20',
  booked: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  dispatched: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  at_pickup: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  in_transit: 'text-[#00C650] bg-[#00C650]/10 border-[#00C650]/20',
  at_delivery: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  delivered: 'text-[#00C650] bg-[#00C650]/10 border-[#00C650]/20',
  invoiced: 'text-blue-300 bg-blue-300/10 border-blue-300/20',
  closed: 'text-[#8B95A5] bg-[#8B95A5]/10 border-[#8B95A5]/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

interface ShipmentCardProps {
  shipment: {
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
  };
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  const statusColor = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.quote;
  const statusLabel = STATUS_LABELS[shipment.status] ?? shipment.status;

  return (
    <Link
      href={`/portal/shipments/${shipment.id}`}
      className="block rounded-xl border border-[#1A2235] bg-[#080F1E] p-5 hover:border-[#00C650]/40 hover:bg-[#0A1628] transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="text-sm font-semibold text-white font-mono">
              {shipment.shipmentNumber}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
              {statusLabel}
            </span>
            {shipment.poNumber && (
              <span className="text-xs text-[#8B95A5]">PO: {shipment.poNumber}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white mb-3">
            <span className="font-medium">{shipment.originCity}, {shipment.originState}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#00C650] shrink-0" />
            <span className="font-medium">{shipment.destCity}, {shipment.destState}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#8B95A5] flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Pickup: {formatDate(shipment.pickupDate)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Delivery: {formatDate(shipment.deliveryDate)}
            </span>
            {shipment.commodity && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {shipment.commodity}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-[#8B95A5] group-hover:text-[#00C650] transition-colors shrink-0 mt-1" />
      </div>
    </Link>
  );
}
