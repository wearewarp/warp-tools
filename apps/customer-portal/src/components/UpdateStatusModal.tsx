'use client';

import { useState } from 'react';

const STATUSES = [
  { value: 'quote', label: 'Quote' },
  { value: 'booked', label: 'Booked' },
  { value: 'at_pickup', label: 'At Pickup' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'at_delivery', label: 'At Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface UpdateStatusModalProps {
  open: boolean;
  shipmentId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateStatusModal({ open, shipmentId, currentStatus, onClose, onSuccess }: UpdateStatusModalProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/shipments/${shipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: notes.trim() || undefined }),
      });
      if (res.ok) {
        setNotes('');
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Update Status</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#080F1E] border border-[#1A2235] text-slate-200 hover:bg-[#0C1528]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#00C650] text-white hover:bg-[#00C650]/90 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
