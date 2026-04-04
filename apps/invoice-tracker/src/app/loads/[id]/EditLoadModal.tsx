'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { MarginIndicator } from '@/components/MarginIndicator';

interface Customer {
  id: string;
  name: string;
}

interface Load {
  id: string;
  loadRef: string;
  customerId: string;
  carrierName: string | null;
  carrierId: string | null;
  origin: string | null;
  destination: string | null;
  revenue: number;
  cost: number;
  status: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  notes: string | null;
}

interface EditLoadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  load: Load;
  customers: Customer[];
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

export function EditLoadModal({ open, onClose, onSuccess, load, customers }: EditLoadModalProps) {
  const [form, setForm] = useState<FormData>({
    loadRef: load.loadRef,
    customerId: load.customerId,
    carrierName: load.carrierName ?? '',
    origin: load.origin ?? '',
    destination: load.destination ?? '',
    revenue: load.revenue.toString(),
    cost: load.cost.toString(),
    status: load.status,
    pickupDate: load.pickupDate ?? '',
    deliveryDate: load.deliveryDate ?? '',
    notes: load.notes ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm({
        loadRef: load.loadRef,
        customerId: load.customerId,
        carrierName: load.carrierName ?? '',
        origin: load.origin ?? '',
        destination: load.destination ?? '',
        revenue: load.revenue.toString(),
        cost: load.cost.toString(),
        status: load.status,
        pickupDate: load.pickupDate ?? '',
        deliveryDate: load.deliveryDate ?? '',
        notes: load.notes ?? '',
      });
      setError(null);
    }
  }, [open, load]);

  const set = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/loads/${load.id}`, {
        method: 'PATCH',
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
        throw new Error(data.error?.formErrors?.[0] ?? 'Failed to update load');
      }

      toast({ message: 'Load updated', type: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const revenue = parseFloat(form.revenue) || 0;
  const cost = parseFloat(form.cost) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl mx-4 bg-[#080F1E] border border-[#1A2235] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Load</h2>
            <p className="text-xs text-[#8B95A5] mt-0.5 font-mono">{load.loadRef}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                Load Ref <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.loadRef}
                onChange={(e) => set('loadRef', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
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
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

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
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Carrier Name</label>
              <input
                type="text"
                value={form.carrierName}
                onChange={(e) => set('carrierName', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Origin</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => set('origin', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Destination</label>
              <input
                type="text"
                value={form.destination}
                onChange={(e) => set('destination', e.target.value)}
                className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Revenue ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A5] text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.revenue}
                  onChange={(e) => set('revenue', e.target.value)}
                  className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
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
                  value={form.cost}
                  onChange={(e) => set('cost', e.target.value)}
                  className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Live margin */}
          {revenue > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8B95A5]">Current margin:</span>
              <MarginIndicator revenue={revenue} cost={cost} size="sm" />
            </div>
          )}

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

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full bg-[#0C1528] border border-[#1A2235] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C650]/50 focus:ring-1 focus:ring-[#00C650]/20 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

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
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
