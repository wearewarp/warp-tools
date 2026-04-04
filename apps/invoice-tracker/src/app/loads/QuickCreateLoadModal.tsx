'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Customer {
  id: string;
  name: string;
}

interface QuickCreateLoadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  prefill?: Partial<FormData>;
}

interface FormData {
  loadRef: string;
  customerId: string;
  carrierName: string;
  origin: string;
  destination: string;
  revenue: string;
  cost: string;
  status: string;
  pickupDate: string;
  deliveryDate: string;
  notes: string;
}

const EMPTY: FormData = {
  loadRef: '',
  customerId: '',
  carrierName: '',
  origin: '',
  destination: '',
  revenue: '',
  cost: '',
  status: 'booked',
  pickupDate: '',
  deliveryDate: '',
  notes: '',
};

function calcMargin(revenue: string, cost: string) {
  const r = parseFloat(revenue) || 0;
  const c = parseFloat(cost) || 0;
  const m = r - c;
  const pct = r > 0 ? (m / r) * 100 : 0;
  return { margin: m, pct, revenue: r, cost: c };
}

function MarginPreview({ revenue, cost }: { revenue: string; cost: string }) {
  const { margin, pct, revenue: r } = calcMargin(revenue, cost);
  if (r === 0) return null;

  const color = pct >= 15 ? '#00C650' : pct >= 10 ? '#F59E0B' : '#EF4444';
  const bg = pct >= 15 ? 'rgba(0, 198, 80, 0.1)' : pct >= 10 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  const Icon = pct >= 15 ? TrendingUp : pct >= 10 ? Minus : TrendingDown;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
      style={{ color, backgroundColor: bg, borderColor: `${color}30` }}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>
        Margin: <strong>${margin.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
        <span className="mx-1 opacity-50">·</span>
        <strong>{pct.toFixed(1)}%</strong>
      </span>
      {pct < 10 && <span className="ml-auto text-xs opacity-80">Low margin!</span>}
    </div>
  );
}

export function QuickCreateLoadModal({ open, onClose, onSuccess, customers, prefill }: QuickCreateLoadModalProps) {
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...prefill });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...prefill });
      setError(null);
    }
  }, [open, prefill]);

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadRef: form.loadRef.trim(),
          customerId: form.customerId,
          carrierName: form.carrierName || null,
          origin: form.origin || null,
          destination: form.destination || null,
          revenue: parseFloat(form.revenue) || 0,
          cost: parseFloat(form.cost) || 0,
          status: form.status,
          pickupDate: form.pickupDate || null,
          deliveryDate: form.deliveryDate || null,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.[0] ?? 'Failed to create load');
      }

      toast({ message: 'Load created', type: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-[#080F1E] border border-[#1A2235] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <div>
            <h2 className="text-lg font-semibold text-white">New Load</h2>
            <p className="text-xs text-[#8B95A5] mt-0.5">Add a shipment to the profitability ledger</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Row 1: Load Ref + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                Load Ref <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="LD-10123"
                value={form.loadRef}
                onChange={(e) => set('loadRef', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              >
                <option value="booked">Booked</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="invoiced">Invoiced</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Row 2: Customer + Carrier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                Customer <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.customerId}
                onChange={(e) => set('customerId', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Carrier Name</label>
              <input
                type="text"
                placeholder="Apex Freight Solutions"
                value={form.carrierName}
                onChange={(e) => set('carrierName', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Origin + Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Origin</label>
              <input
                type="text"
                placeholder="Dallas, TX"
                value={form.origin}
                onChange={(e) => set('origin', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Destination</label>
              <input
                type="text"
                placeholder="Chicago, IL"
                value={form.destination}
                onChange={(e) => set('destination', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Revenue + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Revenue ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A5] text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.revenue}
                  onChange={(e) => set('revenue', e.target.value)}
                  className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Cost ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A5] text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => set('cost', e.target.value)}
                  className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl pl-7 pr-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Margin Preview */}
          <MarginPreview revenue={form.revenue} cost={form.cost} />

          {/* Row 5: Pickup + Delivery dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Pickup Date</label>
              <input
                type="date"
                value={form.pickupDate}
                onChange={(e) => set('pickupDate', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Delivery Date</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => set('deliveryDate', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Any special instructions or notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-[#8B95A5] hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
