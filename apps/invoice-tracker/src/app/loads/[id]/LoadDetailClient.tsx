'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, MapPin, ArrowRight, Calendar, DollarSign, FileText, CreditCard } from 'lucide-react';
import { LoadStatusBadge } from '@/components/LoadStatusBadge';
import { MarginIndicator } from '@/components/MarginIndicator';
import { EditLoadModal } from './EditLoadModal';
import { useToast } from '@/components/Toast';

interface Customer {
  id: string;
  name: string;
}

interface Load {
  id: string;
  loadRef: string;
  customerId: string;
  carrierId: string | null;
  carrierName: string | null;
  origin: string | null;
  destination: string | null;
  revenue: number;
  cost: number;
  status: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  notes: string | null;
  invoiceId: string | null;
  carrierPaymentId: string | null;
  customer: Customer | null;
}

interface LoadDetailClientProps {
  load: Load;
  customers: Customer[];
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-white">{children}</dd>
    </div>
  );
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function LoadDetailClient({ load, customers }: LoadDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/loads/${load.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast({ message: 'Load deleted', type: 'success' });
      router.push('/loads');
      router.refresh();
    } catch {
      toast({ message: 'Failed to delete load', type: 'error' });
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const margin = load.revenue - load.cost;
  const marginPct = load.revenue > 0 ? (margin / load.revenue) * 100 : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/loads"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Loads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">{load.loadRef}</h1>
            <LoadStatusBadge status={load.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-[#8B95A5]">
            {load.customer && (
              <Link href={`/customers/${load.customerId}`} className="hover:text-[#00C650] transition-colors">
                {load.customer.name}
              </Link>
            )}
            {load.carrierName && (
              <span>{load.carrierName}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#8B95A5] hover:text-white border border-[#1A2235] hover:border-[#2A3245] rounded-xl transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-xl transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-2 text-sm text-[#8B95A5] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Route Banner */}
      {(load.origin || load.destination) && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-[#080F1E] border border-[#1A2235] rounded-2xl">
          <MapPin className="h-4 w-4 text-[#8B95A5] flex-shrink-0" />
          <span className="text-white font-medium">{load.origin ?? '—'}</span>
          <ArrowRight className="h-4 w-4 text-[#8B95A5] flex-shrink-0" />
          <span className="text-white font-medium">{load.destination ?? '—'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Financials Card */}
        <div className="lg:col-span-2 bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#8B95A5]" />
            Financials
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-[#0C1528] rounded-xl">
              <p className="text-xs text-[#8B95A5] mb-1">Revenue</p>
              <p className="text-lg font-semibold text-white">{fmt(load.revenue)}</p>
            </div>
            <div className="p-3 bg-[#0C1528] rounded-xl">
              <p className="text-xs text-[#8B95A5] mb-1">Cost</p>
              <p className="text-lg font-semibold text-[#8B95A5]">{fmt(load.cost)}</p>
            </div>
            <div className="p-3 bg-[#0C1528] rounded-xl">
              <p className="text-xs text-[#8B95A5] mb-1">Margin</p>
              <div className="mt-1">
                <MarginIndicator revenue={load.revenue} cost={load.cost} />
              </div>
            </div>
          </div>

          {/* Margin bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[#8B95A5] mb-1.5">
              <span>Margin %</span>
              <span>{marginPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[#0C1528] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, marginPct))}%`,
                  backgroundColor: marginPct >= 15 ? '#00C650' : marginPct >= 10 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#4A5568] mt-1">
              <span>0%</span>
              <span className="text-[#F59E0B]">10%</span>
              <span className="text-[#00C650]">15%+</span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8B95A5]" />
            Details
          </h2>
          <dl className="space-y-3.5">
            <DetailCard label="Pickup">
              {fmtDate(load.pickupDate)}
            </DetailCard>
            <DetailCard label="Delivery">
              {fmtDate(load.deliveryDate)}
            </DetailCard>
            <DetailCard label="Customer">
              {load.customer ? (
                <Link href={`/customers/${load.customerId}`} className="text-[#00C650] hover:underline">
                  {load.customer.name}
                </Link>
              ) : '—'}
            </DetailCard>
            <DetailCard label="Carrier">
              {load.carrierName ?? '—'}
            </DetailCard>
          </dl>
        </div>
      </div>

      {/* Links row */}
      {(load.invoiceId || load.carrierPaymentId) && (
        <div className="flex items-center gap-3 mb-4">
          {load.invoiceId && (
            <Link
              href={`/invoices/${load.invoiceId}`}
              className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] hover:border-[#00C650]/30 rounded-xl text-sm text-[#8B95A5] hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-[#00C650]" />
              View Invoice
            </Link>
          )}
          {load.carrierPaymentId && (
            <Link
              href={`/payments/${load.carrierPaymentId}`}
              className="flex items-center gap-2 px-3 py-2 bg-[#080F1E] border border-[#1A2235] hover:border-[#00C650]/30 rounded-xl text-sm text-[#8B95A5] hover:text-white transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 text-[#4B8EE8]" />
              View Carrier Payment
            </Link>
          )}
        </div>
      )}

      {/* Notes */}
      {load.notes && (
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Notes</h2>
          <p className="text-sm text-[#8B95A5] leading-relaxed whitespace-pre-wrap">{load.notes}</p>
        </div>
      )}

      {/* Edit Modal */}
      <EditLoadModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
        load={load}
        customers={customers}
      />
    </div>
  );
}
