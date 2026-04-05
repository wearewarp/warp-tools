import { redirect, notFound } from 'next/navigation';
import { getPortalCustomerFromCookies } from '@/lib/portal-auth';
import { db } from '@/db';
import { portalShipments, portalEvents, portalDocuments, portalMessages, portalSettings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { StatusTimeline } from '@/components/portal/StatusTimeline';
import { EventList } from '@/components/portal/EventList';
import { DocumentGrid } from '@/components/portal/DocumentGrid';
import { MessageThread } from '@/components/portal/MessageThread';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Package, MapPin } from 'lucide-react';
import type { ShipmentStatus } from '@/db/schema';

export const dynamic = 'force-dynamic';

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

const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  sent: 'Invoice Sent',
  paid: 'Paid',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  sent: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-[#00C650] bg-[#00C650]/10 border-[#00C650]/20',
};

const EQUIP_LABELS: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter Van',
  cargo_van: 'Cargo Van',
  power_only: 'Power Only',
};

function formatDate(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(n: number | null) {
  if (!n) return '\u2014';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getPortalCustomerFromCookies();
  if (!customer) {
    redirect('/portal/login');
  }

  const { id } = await params;

  const [shipment] = await db
    .select({
      id: portalShipments.id,
      shipmentNumber: portalShipments.shipmentNumber,
      status: portalShipments.status,
      equipmentType: portalShipments.equipmentType,
      commodity: portalShipments.commodity,
      weight: portalShipments.weight,
      pieces: portalShipments.pieces,
      originCity: portalShipments.originCity,
      originState: portalShipments.originState,
      originZip: portalShipments.originZip,
      originAddress: portalShipments.originAddress,
      destCity: portalShipments.destCity,
      destState: portalShipments.destState,
      destZip: portalShipments.destZip,
      destAddress: portalShipments.destAddress,
      pickupDate: portalShipments.pickupDate,
      pickupTimeWindow: portalShipments.pickupTimeWindow,
      deliveryDate: portalShipments.deliveryDate,
      deliveryTimeWindow: portalShipments.deliveryTimeWindow,
      actualPickupAt: portalShipments.actualPickupAt,
      actualDeliveryAt: portalShipments.actualDeliveryAt,
      customerRate: portalShipments.customerRate,
      invoiceRef: portalShipments.invoiceRef,
      invoiceStatus: portalShipments.invoiceStatus,
      invoiceAmount: portalShipments.invoiceAmount,
      specialInstructions: portalShipments.specialInstructions,
      bolNumber: portalShipments.bolNumber,
      poNumber: portalShipments.poNumber,
      currentLocationCity: portalShipments.currentLocationCity,
      currentLocationState: portalShipments.currentLocationState,
      currentEta: portalShipments.currentEta,
      customerId: portalShipments.customerId,
      createdAt: portalShipments.createdAt,
      updatedAt: portalShipments.updatedAt,
    })
    .from(portalShipments)
    .where(
      and(
        eq(portalShipments.id, id),
        eq(portalShipments.customerId, customer.id)
      )
    );

  if (!shipment) {
    notFound();
  }

  const events = await db
    .select({
      id: portalEvents.id,
      eventType: portalEvents.eventType,
      description: portalEvents.description,
      locationCity: portalEvents.locationCity,
      locationState: portalEvents.locationState,
      createdAt: portalEvents.createdAt,
    })
    .from(portalEvents)
    .where(
      and(
        eq(portalEvents.shipmentId, id),
        eq(portalEvents.isVisibleToCustomer, true)
      )
    )
    .orderBy(sql`${portalEvents.createdAt} DESC`);

  const documents = await db
    .select({
      id: portalDocuments.id,
      docType: portalDocuments.docType,
      filename: portalDocuments.filename,
      originalName: portalDocuments.originalName,
      fileSize: portalDocuments.fileSize,
      mimeType: portalDocuments.mimeType,
      uploadedAt: portalDocuments.uploadedAt,
    })
    .from(portalDocuments)
    .where(
      and(
        eq(portalDocuments.shipmentId, id),
        eq(portalDocuments.isVisibleToCustomer, true)
      )
    )
    .orderBy(sql`${portalDocuments.uploadedAt} DESC`);

  const messages = await db
    .select({
      id: portalMessages.id,
      senderType: portalMessages.senderType,
      message: portalMessages.message,
      isRead: portalMessages.isRead,
      createdAt: portalMessages.createdAt,
    })
    .from(portalMessages)
    .where(
      and(
        eq(portalMessages.shipmentId, id),
        eq(portalMessages.customerId, customer.id)
      )
    )
    .orderBy(sql`${portalMessages.createdAt} ASC`);

  const [settings] = await db.select().from(portalSettings).where(eq(portalSettings.id, 'default'));

  const statusColor = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.quote;
  const statusLabel = STATUS_LABELS[shipment.status] ?? shipment.status;
  const showInvoice = shipment.status === 'invoiced' || shipment.status === 'closed' ||
    (shipment.invoiceAmount != null && shipment.invoiceAmount > 0);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shipments
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white font-mono">
                {shipment.shipmentNumber}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            {shipment.poNumber && (
              <p className="text-sm text-[#8B95A5] mt-1">PO# {shipment.poNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
          Shipment Progress
        </h2>
        <StatusTimeline status={shipment.status as ShipmentStatus} />
      </div>

      {/* Route Card */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
          Route Details
        </h2>
        <div className="flex items-center gap-4 flex-wrap mb-5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Origin
            </p>
            <p className="text-lg font-semibold text-white">
              {shipment.originCity}, {shipment.originState}
            </p>
            {shipment.originAddress && (
              <p className="text-xs text-[#8B95A5] mt-0.5">{shipment.originAddress}</p>
            )}
            {shipment.originZip && (
              <p className="text-xs text-[#8B95A5]">{shipment.originZip}</p>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-[#00C650] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#8B95A5] uppercase tracking-wide mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Destination
            </p>
            <p className="text-lg font-semibold text-white">
              {shipment.destCity}, {shipment.destState}
            </p>
            {shipment.destAddress && (
              <p className="text-xs text-[#8B95A5] mt-0.5">{shipment.destAddress}</p>
            )}
            {shipment.destZip && (
              <p className="text-xs text-[#8B95A5]">{shipment.destZip}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#1A2235]">
          <div>
            <p className="text-xs text-[#8B95A5] flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3" />
              Pickup Date
            </p>
            <p className="text-sm text-white font-medium">{formatDate(shipment.pickupDate)}</p>
            {shipment.pickupTimeWindow && (
              <p className="text-xs text-[#8B95A5]">{shipment.pickupTimeWindow}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#8B95A5] flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3" />
              Delivery Date
            </p>
            <p className="text-sm text-white font-medium">{formatDate(shipment.deliveryDate)}</p>
            {shipment.deliveryTimeWindow && (
              <p className="text-xs text-[#8B95A5]">{shipment.deliveryTimeWindow}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#8B95A5] flex items-center gap-1 mb-1">
              <Package className="h-3 w-3" />
              Equipment
            </p>
            <p className="text-sm text-white font-medium">
              {shipment.equipmentType ? (EQUIP_LABELS[shipment.equipmentType] ?? shipment.equipmentType) : '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8B95A5] mb-1">Commodity</p>
            <p className="text-sm text-white font-medium">{shipment.commodity ?? '\u2014'}</p>
          </div>
          {shipment.bolNumber && (
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">BOL #</p>
              <p className="text-sm text-white font-medium">{shipment.bolNumber}</p>
            </div>
          )}
          {shipment.weight != null && (
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">Weight</p>
              <p className="text-sm text-white font-medium">{shipment.weight.toLocaleString()} lbs</p>
            </div>
          )}
          {shipment.pieces != null && (
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">Pieces</p>
              <p className="text-sm text-white font-medium">{shipment.pieces}</p>
            </div>
          )}
          {shipment.currentLocationCity && (
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">Current Location</p>
              <p className="text-sm text-white font-medium">
                {shipment.currentLocationCity}, {shipment.currentLocationState}
              </p>
            </div>
          )}
          {shipment.currentEta && (
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">Current ETA</p>
              <p className="text-sm text-white font-medium">{formatDate(shipment.currentEta)}</p>
            </div>
          )}
        </div>

        {shipment.specialInstructions && (
          <div className="mt-4 pt-4 border-t border-[#1A2235]">
            <p className="text-xs text-[#8B95A5] mb-1">Special Instructions</p>
            <p className="text-sm text-white">{shipment.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* Invoice */}
      {showInvoice && (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
          <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
            Invoice
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {shipment.invoiceRef && (
                <>
                  <p className="text-xs text-[#8B95A5] mb-1">Invoice Ref</p>
                  <p className="text-sm text-white font-medium">{shipment.invoiceRef}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-[#8B95A5] mb-1">Amount</p>
                <p className="text-xl font-bold text-white">{formatCurrency(shipment.invoiceAmount)}</p>
              </div>
              {shipment.invoiceStatus && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${INVOICE_STATUS_COLORS[shipment.invoiceStatus] ?? INVOICE_STATUS_COLORS.pending}`}>
                  {INVOICE_STATUS_LABELS[shipment.invoiceStatus] ?? shipment.invoiceStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Updates / Events */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
          Updates
        </h2>
        <EventList events={events} />
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
          Documents
        </h2>
        <DocumentGrid documents={documents} shipmentId={shipment.id} />
      </div>

      {/* Messages */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wide mb-4">
          Messages
        </h2>
        {settings?.supportEmail && (
          <p className="text-xs text-[#8B95A5] mb-4">
            Questions? You can also reach your broker at{' '}
            <a href={`mailto:${settings.supportEmail}`} className="text-[#00C650] hover:underline">
              {settings.supportEmail}
            </a>
            {settings.supportPhone ? ` or ${settings.supportPhone}` : ''}.
          </p>
        )}
        <MessageThread messages={messages} shipmentId={shipment.id} />
      </div>
    </div>
  );
}
