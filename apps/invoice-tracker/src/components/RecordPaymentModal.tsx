'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface RecordPaymentModalProps {
  invoiceId: string;
  balanceDue: number;
  payment?: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

export function RecordPaymentModal({
  invoiceId,
  balanceDue,
  payment,
  onClose,
  onSaved,
}: RecordPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    amount: payment ? String(payment.amount) : String(balanceDue > 0 ? balanceDue.toFixed(2) : ''),
    paymentDate: payment ? payment.paymentDate : today,
    paymentMethod: payment ? payment.paymentMethod : 'ach',
    referenceNumber: payment?.referenceNumber ?? '',
    notes: payment?.notes ?? '',
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      amount: parseFloat(form.amount),
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      referenceNumber: form.referenceNumber || null,
      notes: form.notes || null,
    };

    try {
      let res: Response;
      if (payment) {
        res = await fetch(`/api/invoices/${invoiceId}/payments/${payment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/invoices/${invoiceId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(', ')
          : data.error?.formErrors?.[0] ?? 'Failed to record payment';
        toast({ message: msg, type: 'error' });
        return;
      }

      toast({ message: payment ? 'Payment updated' : 'Payment recorded', type: 'success' });
      onSaved();
    } catch {
      toast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-base font-semibold text-white">
            {payment ? 'Edit Payment' : 'Record Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
              Amount <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A5] text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={cn(inputClass, 'pl-7')}
                placeholder="0.00"
              />
            </div>
            {balanceDue > 0 && !payment && (
              <p className="text-xs text-[#8B95A5] mt-1">Balance due: ${balanceDue.toFixed(2)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
              Payment Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={form.paymentDate}
              onChange={(e) => set('paymentDate', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
              className={inputClass}
            >
              <option value="ach">ACH</option>
              <option value="wire">Wire Transfer</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="factoring">Factoring</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Reference #</label>
            <input
              type="text"
              value={form.referenceNumber}
              onChange={(e) => set('referenceNumber', e.target.value)}
              placeholder="ACH-12345 / CHK-9876"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes"
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
            >
              {loading ? 'Saving...' : payment ? 'Update Payment' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
