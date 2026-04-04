'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { X } from 'lucide-react';
import { CHECK_CALL_STATUSES, CONTACT_METHODS, type CheckCall } from '@/db/schema';

interface Props {
  loadId: number;
  existing?: CheckCall;
  onClose: () => void;
}

const CHECK_CALL_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  at_pickup: 'At Pickup',
  loading: 'Loading',
  loaded: 'Loaded',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  unloading: 'Unloading',
  delivered: 'Delivered',
  delayed: 'Delayed',
  issue: 'Issue',
};

const CONTACT_LABELS: Record<string, string> = {
  phone: 'Phone',
  text: 'Text',
  email: 'Email',
  tracking: 'Tracking',
  other: 'Other',
};

export function CheckCallModal({ loadId, existing, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    status: existing?.status ?? 'in_transit',
    location_city: existing?.location_city ?? '',
    location_state: existing?.location_state ?? '',
    eta: existing?.eta ? existing.eta.slice(0, 16) : '',
    notes: existing?.notes ?? '',
    contact_method: existing?.contact_method ?? 'phone',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!existing;
      const url = isEdit
        ? `/api/loads/${loadId}/check-calls/${existing!.id}`
        : `/api/loads/${loadId}/check-calls`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          location_city: form.location_city || null,
          location_state: form.location_state || null,
          eta: form.eta || null,
          notes: form.notes || null,
          contact_method: form.contact_method,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Failed to save check call', type: 'error' });
        return;
      }

      toast({ message: isEdit ? 'Check call updated' : 'Check call added', type: 'success' });
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
          <h2 className="text-lg font-bold text-white">{existing ? 'Edit Check Call' : 'Add Check Call'}</h2>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Status *</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00C650]/50"
            >
              {CHECK_CALL_STATUSES.map((s) => (
                <option key={s} value={s}>{CHECK_CALL_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Location City</label>
              <input
                type="text"
                value={form.location_city}
                onChange={(e) => set('location_city', e.target.value)}
                placeholder="Oklahoma City"
                className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">State</label>
              <input
                type="text"
                value={form.location_state}
                onChange={(e) => set('location_state', e.target.value)}
                placeholder="OK"
                maxLength={2}
                className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">ETA</label>
            <input
              type="datetime-local"
              value={form.eta}
              onChange={(e) => set('eta', e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00C650]/50 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Contact Method</label>
            <select
              value={form.contact_method}
              onChange={(e) => set('contact_method', e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00C650]/50"
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{CONTACT_LABELS[m] ?? m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Driver notes, location update, issues…"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none h-20"
            />
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
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : existing ? 'Save Changes' : 'Add Check Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
