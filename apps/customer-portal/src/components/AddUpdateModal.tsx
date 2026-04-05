'use client';

import { useState } from 'react';

interface AddUpdateModalProps {
  open: boolean;
  shipmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_TYPES = [
  { value: 'check_call', label: 'Check Call' },
  { value: 'note', label: 'Note' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'document_added', label: 'Document Added' },
  { value: 'invoice_update', label: 'Invoice Update' },
];

export function AddUpdateModal({ open, shipmentId, onClose, onSuccess }: AddUpdateModalProps) {
  const [eventType, setEventType] = useState('check_call');
  const [description, setDescription] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [isVisibleToCustomer, setIsVisibleToCustomer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/shipments/${shipmentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          description: description.trim(),
          locationCity: locationCity.trim() || undefined,
          locationState: locationState.trim() || undefined,
          isVisibleToCustomer,
        }),
      });
      if (res.ok) {
        setDescription('');
        setLocationCity('');
        setLocationState('');
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
        <h3 className="text-lg font-semibold text-white mb-4">Add Update</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1">City</label>
              <input
                type="text"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1">State</label>
              <input
                type="text"
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                maxLength={2}
                className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisibleToCustomer}
              onChange={(e) => setIsVisibleToCustomer(e.target.checked)}
              className="rounded border-[#1A2235] bg-[#040810] text-[#00C650] focus:ring-[#00C650]"
            />
            Visible to customer
          </label>
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
              {submitting ? 'Adding...' : 'Add Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
