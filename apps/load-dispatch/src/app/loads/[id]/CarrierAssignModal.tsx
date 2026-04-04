'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  loadId: number;
  customerRate: number | null;
  onClose: () => void;
}

export function CarrierAssignModal({ loadId, customerRate, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    carrier_name: '',
    carrier_contact: '',
    carrier_phone: '',
    carrier_email: '',
    carrier_rate: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const carrierRateNum = parseFloat(form.carrier_rate) || 0;
  const custRate = customerRate ?? 0;
  const margin = custRate - carrierRateNum;
  const marginPct = custRate > 0 ? (margin / custRate) * 100 : 0;

  const marginColor =
    marginPct >= 15 ? 'text-green-400' : marginPct >= 10 ? 'text-yellow-400' : 'text-red-400';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.carrier_name || !form.carrier_rate) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier_name: form.carrier_name,
          carrier_contact: form.carrier_contact || null,
          carrier_phone: form.carrier_phone || null,
          carrier_email: form.carrier_email || null,
          carrier_rate: parseFloat(form.carrier_rate),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Failed to assign carrier', type: 'error' });
        return;
      }

      toast({ message: 'Carrier assigned — load covered', type: 'success' });
      onClose();
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Assign Carrier</h2>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Carrier Name *</label>
            <input
              type="text"
              required
              value={form.carrier_name}
              onChange={(e) => set('carrier_name', e.target.value)}
              placeholder="e.g. Apex Freight LLC"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Contact Name</label>
              <input
                type="text"
                value={form.carrier_contact}
                onChange={(e) => set('carrier_contact', e.target.value)}
                placeholder="Mike Rodriguez"
                className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.carrier_phone}
                onChange={(e) => set('carrier_phone', e.target.value)}
                placeholder="555-555-5555"
                className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={form.carrier_email}
              onChange={(e) => set('carrier_email', e.target.value)}
              placeholder="dispatch@carrier.com"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          {/* Rate section */}
          <div className="bg-[#040810] rounded-xl border border-[#1A2235] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8B95A5] font-medium">Customer Rate</span>
              <span className="text-sm font-semibold text-slate-300">{formatCurrency(custRate)}</span>
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Carrier Rate *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.carrier_rate}
                onChange={(e) => set('carrier_rate', e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
            {carrierRateNum > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#1A2235]">
                <span className="text-xs text-[#8B95A5]">Margin</span>
                <span className={`text-sm font-bold ${marginColor}`}>
                  {formatCurrency(margin)} ({marginPct.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.carrier_name || !form.carrier_rate}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning…' : 'Assign Carrier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
