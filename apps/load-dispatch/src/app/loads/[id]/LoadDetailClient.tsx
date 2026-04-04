'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { CarrierAssignModal } from './CarrierAssignModal';
import { RateConModal } from './RateConModal';
import { StatusChangeButton } from './StatusChangeButton';
import Link from 'next/link';
import {
  Phone, Mail, FileText, Copy, Truck,
  ArrowRight, Thermometer, Package, Scale, Ruler, ChevronRight,
} from 'lucide-react';
import type { Load, CheckCall, LoadStatus } from '@/db/schema';
import { CheckCallTimeline } from '@/components/CheckCallTimeline';
import {
  formatCurrency, formatDate, formatTime,
  getStatusLabel, getStatusColor, getEquipmentLabel,
} from '@/lib/utils';

interface Props {
  load: Load;
  checkCalls: CheckCall[];
}

// Status action config — what button to show per status
const NEXT_ACTION: Partial<Record<LoadStatus, { label: string; status: LoadStatus; variant: 'green' | 'default' }>> = {
  new: { label: 'Post Load', status: 'posted', variant: 'green' },
  covered: { label: 'Dispatch', status: 'dispatched', variant: 'green' },
  dispatched: { label: 'Mark Picked Up', status: 'picked_up', variant: 'default' },
  picked_up: { label: 'Mark Delivered', status: 'delivered', variant: 'default' },
  in_transit: { label: 'Mark Delivered', status: 'delivered', variant: 'default' },
  delivered: { label: 'Mark Invoiced', status: 'invoiced', variant: 'default' },
  invoiced: { label: 'Close Load', status: 'closed', variant: 'green' },
};

const CANCELLABLE: LoadStatus[] = ['new', 'posted', 'covered', 'dispatched', 'picked_up', 'in_transit', 'delivered', 'invoiced'];

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#1A2235] last:border-0">
      <span className="text-xs text-[#8B95A5] flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-200 text-right">{value ?? '—'}</span>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-white mb-4">{children}</h2>;
}

export function LoadDetailClient({ load, checkCalls }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRateCon, setShowRateCon] = useState(false);
  const [notesDraft, setNotesDraft] = useState(() => load.notes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);

  const nextAction = NEXT_ACTION[load.status];
  const canCancel = CANCELLABLE.includes(load.status);
  const canShowRateCon = ['covered', 'dispatched', 'picked_up', 'in_transit', 'delivered', 'invoiced', 'closed'].includes(load.status);

  const marginPct = load.margin_pct ?? 0;
  const marginColor =
    marginPct >= 15 ? 'text-green-400' : marginPct >= 10 ? 'text-yellow-400' : 'text-red-400';

  async function saveNotes() {
    if (notesDraft === (load.notes ?? '')) return;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/loads/${load.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (!res.ok) {
        toast({ message: 'Failed to save notes', type: 'error' });
        return;
      }
      toast({ message: 'Notes saved', type: 'success' });
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDuplicate() {
    try {
      const res = await fetch(`/api/loads/${load.id}/duplicate`, { method: 'POST' });
      if (!res.ok) {
        toast({ message: 'Failed to duplicate load', type: 'error' });
        return;
      }
      const data = await res.json();
      toast({ message: `Duplicated as ${data.load.load_number}`, type: 'success' });
      router.push(`/loads/${data.load.id}`);
    } catch {
      toast({ message: 'Network error', type: 'error' });
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold font-mono text-white">{load.load_number}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(load.status)}`}>
              {getStatusLabel(load.status)}
            </span>
          </div>
          <p className="text-sm text-[#8B95A5] mt-1">
            {load.customer_name} · {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {load.status === 'posted' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
            >
              Cover Load
            </button>
          )}
          {nextAction && (
            <StatusChangeButton
              loadId={load.id}
              targetStatus={nextAction.status}
              label={nextAction.label}
              variant={nextAction.variant}
            />
          )}
          {canCancel && (
            <StatusChangeButton
              loadId={load.id}
              targetStatus="cancelled"
              label="Cancel"
              variant="red"
            />
          )}
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* Route Card */}
          <Card>
            <SectionTitle>Route</SectionTitle>
            <div className="flex items-stretch gap-4">
              {/* Origin */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Pickup</div>
                <div className="text-lg font-bold text-white">{load.origin_city}, {load.origin_state}</div>
                {load.origin_zip && <div className="text-xs text-[#8B95A5]">{load.origin_zip}</div>}
                {load.origin_address && (
                  <div className="text-xs text-[#8B95A5] mt-0.5 line-clamp-1">{load.origin_address}</div>
                )}
                <div className="mt-2 text-sm text-slate-300 font-semibold">{formatDate(load.pickup_date)}</div>
                {(load.pickup_time_from || load.pickup_time_to) && (
                  <div className="text-xs text-[#8B95A5]">
                    {formatTime(load.pickup_time_from)}{load.pickup_time_to ? ` – ${formatTime(load.pickup_time_to)}` : ''}
                  </div>
                )}
                {load.origin_contact_name && (
                  <div className="mt-2 text-xs text-[#8B95A5]">
                    {load.origin_contact_name}
                    {load.origin_contact_phone && (
                      <a href={`tel:${load.origin_contact_phone}`} className="ml-1 text-[#00C650] hover:underline">
                        {load.origin_contact_phone}
                      </a>
                    )}
                  </div>
                )}
                {load.pickup_number && (
                  <div className="mt-1 text-xs text-[#8B95A5]">Pickup #: <span className="text-slate-300">{load.pickup_number}</span></div>
                )}
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                <div className="w-px h-4 bg-[#1A2235]" />
                <ArrowRight className="h-5 w-5 text-[#00C650] my-1" />
                {load.miles && (
                  <div className="text-xs text-[#8B95A5] whitespace-nowrap">{load.miles.toLocaleString()} mi</div>
                )}
                <div className="w-px h-4 bg-[#1A2235]" />
              </div>

              {/* Destination */}
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Delivery</div>
                <div className="text-lg font-bold text-white">{load.dest_city}, {load.dest_state}</div>
                {load.dest_zip && <div className="text-xs text-[#8B95A5]">{load.dest_zip}</div>}
                {load.dest_address && (
                  <div className="text-xs text-[#8B95A5] mt-0.5 line-clamp-1">{load.dest_address}</div>
                )}
                <div className="mt-2 text-sm text-slate-300 font-semibold">{formatDate(load.delivery_date)}</div>
                {(load.delivery_time_from || load.delivery_time_to) && (
                  <div className="text-xs text-[#8B95A5]">
                    {formatTime(load.delivery_time_from)}{load.delivery_time_to ? ` – ${formatTime(load.delivery_time_to)}` : ''}
                  </div>
                )}
                {load.dest_contact_name && (
                  <div className="mt-2 text-xs text-[#8B95A5]">
                    {load.dest_contact_name}
                    {load.dest_contact_phone && (
                      <a href={`tel:${load.dest_contact_phone}`} className="ml-1 text-[#00C650] hover:underline">
                        {load.dest_contact_phone}
                      </a>
                    )}
                  </div>
                )}
                {load.delivery_number && (
                  <div className="mt-1 text-xs text-[#8B95A5]">Delivery #: <span className="text-slate-300">{load.delivery_number}</span></div>
                )}
              </div>
            </div>
          </Card>

          {/* Check Call Timeline */}
          <Card>
            <CheckCallTimeline loadId={load.id} checkCalls={checkCalls} />
          </Card>

          {/* Notes */}
          <Card>
            <SectionTitle>Notes</SectionTitle>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add internal notes here… (saves on blur)"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none h-28 transition-colors"
            />
            {notesSaving && <p className="text-xs text-[#8B95A5] mt-1">Saving…</p>}
          </Card>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-5">

          {/* Freight Card */}
          <Card>
            <SectionTitle>Freight</SectionTitle>
            <div className="space-y-0">
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#040810] border border-[#1A2235] text-sm font-semibold text-slate-200">
                  <Truck className="h-4 w-4 text-[#00C650]" />
                  {getEquipmentLabel(load.equipment_type)}
                </span>
              </div>
              <FieldRow label="Commodity" value={<span className="flex items-center gap-1"><Package className="h-3.5 w-3.5 text-[#8B95A5]" />{load.commodity}</span>} />
              <FieldRow label="Weight" value={load.weight ? <span className="flex items-center gap-1"><Scale className="h-3.5 w-3.5 text-[#8B95A5]" />{load.weight.toLocaleString()} lbs</span> : null} />
              {(load.temperature_min != null || load.temperature_max != null) && (
                <FieldRow label="Temperature" value={
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Thermometer className="h-3.5 w-3.5" />
                    {load.temperature_min}°F – {load.temperature_max}°F
                  </span>
                } />
              )}
              {(load.dims_length || load.dims_width || load.dims_height) && (
                <FieldRow label="Dimensions" value={
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5 text-[#8B95A5]" />
                    {load.dims_length ?? '?'}L × {load.dims_width ?? '?'}W × {load.dims_height ?? '?'}H
                  </span>
                } />
              )}
              {load.special_instructions && (
                <div className="pt-2">
                  <div className="text-xs text-[#8B95A5] mb-1">Special Instructions</div>
                  <p className="text-sm text-yellow-300/80 bg-yellow-400/5 rounded-lg p-2 border border-yellow-400/10">
                    {load.special_instructions}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Carrier Card */}
          <Card>
            <SectionTitle>Carrier</SectionTitle>
            {!load.carrier_name ? (
              <div className="text-center py-4">
                <Truck className="h-8 w-8 mx-auto text-[#1A2235] mb-2" />
                <p className="text-sm text-[#8B95A5] mb-3">No carrier assigned</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
                >
                  Find Carrier
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                <div className="text-base font-bold text-white mb-1">{load.carrier_name}</div>
                {load.carrier_contact && (
                  <div className="text-sm text-[#8B95A5] mb-3">{load.carrier_contact}</div>
                )}
                <FieldRow
                  label="Phone"
                  value={
                    load.carrier_phone ? (
                      <a href={`tel:${load.carrier_phone}`} className="flex items-center gap-1 text-[#00C650] hover:underline">
                        <Phone className="h-3.5 w-3.5" />
                        {load.carrier_phone}
                      </a>
                    ) : null
                  }
                />
                <FieldRow
                  label="Email"
                  value={
                    load.carrier_email ? (
                      <a href={`mailto:${load.carrier_email}`} className="flex items-center gap-1 text-[#00C650] hover:underline text-xs">
                        <Mail className="h-3.5 w-3.5" />
                        {load.carrier_email}
                      </a>
                    ) : null
                  }
                />
                <FieldRow label="Carrier Rate" value={formatCurrency(load.carrier_rate)} />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
                  >
                    Change Carrier
                  </button>
                  {canShowRateCon && (
                    <button
                      onClick={() => setShowRateCon(true)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00C650]/10 text-[#00C650] border border-[#00C650]/20 hover:bg-[#00C650]/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Rate Con
                    </button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Financials Card */}
          <Card>
            <SectionTitle>Financials</SectionTitle>
            <FieldRow label="Customer Rate" value={<span className="font-semibold text-white">{formatCurrency(load.customer_rate)}</span>} />
            <FieldRow label="Carrier Rate" value={formatCurrency(load.carrier_rate)} />
            <FieldRow
              label="Margin"
              value={
                load.margin != null ? (
                  <span className={`font-bold ${marginColor}`}>
                    {formatCurrency(load.margin)} ({(load.margin_pct ?? 0).toFixed(1)}%)
                  </span>
                ) : '—'
              }
            />
            <FieldRow label="Rate Type" value={load.rate_type === 'per_mile' ? 'Per Mile' : 'Flat'} />
            <FieldRow label="Miles" value={load.miles ? `${load.miles.toLocaleString()} mi` : null} />
          </Card>

          {/* References Card */}
          <Card>
            <SectionTitle>References</SectionTitle>
            <FieldRow label="Customer Ref" value={load.customer_ref} />
            <FieldRow label="BOL #" value={load.bol_number} />
            <FieldRow label="PRO #" value={load.pro_number} />
          </Card>

          {/* Timestamps Card (status history) */}
          {(load.posted_at || load.covered_at || load.dispatched_at || load.picked_up_at || load.delivered_at || load.cancelled_at) && (
            <Card>
              <SectionTitle>Timeline</SectionTitle>
              <div className="space-y-1">
                {load.posted_at && <StatusTs label="Posted" ts={load.posted_at} />}
                {load.covered_at && <StatusTs label="Covered" ts={load.covered_at} />}
                {load.dispatched_at && <StatusTs label="Dispatched" ts={load.dispatched_at} />}
                {load.picked_up_at && <StatusTs label="Picked Up" ts={load.picked_up_at} />}
                {load.delivered_at && <StatusTs label="Delivered" ts={load.delivered_at} />}
                {load.invoiced_at && <StatusTs label="Invoiced" ts={load.invoiced_at} />}
                {load.closed_at && <StatusTs label="Closed" ts={load.closed_at} />}
                {load.cancelled_at && <StatusTs label="Cancelled" ts={load.cancelled_at} />}
              </div>
              {load.cancellation_reason && (
                <div className="mt-3 p-2 rounded-lg bg-red-400/5 border border-red-400/10">
                  <div className="text-xs text-[#8B95A5] mb-0.5">Cancellation Reason</div>
                  <div className="text-sm text-red-300">{load.cancellation_reason}</div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Actions row ─────────────────────────────────────────── */}
      <Card className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/loads/${load.id}/edit`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
        >
          Edit Load
          <ChevronRight className="h-4 w-4" />
        </Link>
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
        >
          <Copy className="h-4 w-4" />
          Duplicate Load
        </button>
        <Link
          href="/loads"
          className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-[#8B95A5] hover:text-white transition-colors"
        >
          ← Back to Board
        </Link>
      </Card>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showAssignModal && (
        <CarrierAssignModal
          loadId={load.id}
          customerRate={load.customer_rate}
          onClose={() => setShowAssignModal(false)}
        />
      )}
      {showRateCon && (
        <RateConModal
          loadId={load.id}
          loadNumber={load.load_number}
          carrierEmail={load.carrier_email}
          onClose={() => setShowRateCon(false)}
        />
      )}
    </div>
  );
}

function StatusTs({ label, ts }: { label: string; ts: string }) {
  const d = new Date(ts);
  const formatted = d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#8B95A5]">{label}</span>
      <span className="text-xs text-slate-400">{formatted}</span>
    </div>
  );
}
