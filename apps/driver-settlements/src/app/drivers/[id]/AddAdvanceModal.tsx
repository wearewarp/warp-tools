'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddAdvanceModalProps {
  driverId: number;
  onClose: () => void;
  onAdded: () => void;
}

export function AddAdvanceModal({ driverId, onClose, onAdded }: AddAdvanceModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.driver_id = String(driverId);

    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to create advance');
      }

      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-[#0C1528] border border-[#1A2235] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-base font-semibold text-white">New Advance</h2>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">
              Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8B95A5] text-sm">$</span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] pl-7 pr-3 focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              defaultValue={today}
              required
              className="w-full h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] text-sm text-white px-3 focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Reason</label>
            <input
              type="text"
              name="reason"
              placeholder="e.g. Fuel advance, emergency expense..."
              className="w-full h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] px-3 focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#1A2235] text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-[#00C650] text-black text-sm font-semibold hover:bg-[#00C650]/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
