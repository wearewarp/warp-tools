'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface PaymentFormData {
  carrierName: string;
  loadRef: string;
  amount: string;
  payType: 'standard' | 'quick_pay' | 'hold';
  quickPayDiscount: string;
  scheduledDate: string;
  notes: string;
}

interface PaymentFormProps {
  mode: 'create' | 'edit';
  paymentId?: string;
  initialData?: Partial<PaymentFormData>;
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
        {label} {required && <span className="text-[#FF4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

export function PaymentForm({ mode, paymentId, initialData }: PaymentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PaymentFormData>({
    carrierName: initialData?.carrierName ?? '',
    loadRef: initialData?.loadRef ?? '',
    amount: initialData?.amount ?? '',
    payType: initialData?.payType ?? 'standard',
    quickPayDiscount: initialData?.quickPayDiscount ?? '',
    scheduledDate: initialData?.scheduledDate ?? '',
    notes: initialData?.notes ?? '',
  });

  const [netAmount, setNetAmount] = useState<number | null>(null);

  function set(key: keyof PaymentFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-calculate net amount for quick_pay
  useEffect(() => {
    const amount = parseFloat(form.amount);
    const discount = parseFloat(form.quickPayDiscount);
    if (form.payType === 'quick_pay' && !isNaN(amount) && !isNaN(discount)) {
      setNetAmount(amount - (amount * discount) / 100);
    } else if (!isNaN(amount)) {
      setNetAmount(amount);
    } else {
      setNetAmount(null);
    }
  }, [form.amount, form.payType, form.quickPayDiscount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const amount = parseFloat(form.amount);
    const discount =
      form.payType === 'quick_pay' && form.quickPayDiscount
        ? parseFloat(form.quickPayDiscount)
        : null;
    const net =
      form.payType === 'quick_pay' && discount != null
        ? amount - (amount * discount) / 100
        : amount;

    const payload = {
      carrierName: form.carrierName,
      loadRef: form.loadRef || null,
      amount,
      payType: form.payType,
      quickPayDiscount: discount,
      netAmount: net,
      scheduledDate: form.scheduledDate || null,
      notes: form.notes || null,
    };

    try {
      const url = mode === 'create' ? '/api/carrier-payments' : `/api/carrier-payments/${paymentId}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg =
          data.error?.fieldErrors
            ? Object.values(data.error.fieldErrors).flat().join(', ')
            : data.error?.formErrors?.[0] ?? `Failed to ${mode === 'create' ? 'create' : 'update'} payment`;
        setError(msg as string);
        toast({ message: msg as string, type: 'error' });
        return;
      }

      const payment = await res.json();
      const successMsg = mode === 'create' ? 'Payment created successfully' : 'Payment updated successfully';
      toast({ message: successMsg, type: 'success' });
      router.push(`/payments/${payment.id}`);
      router.refresh();
    } catch {
      const msg = 'An unexpected error occurred';
      setError(msg);
      toast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const isCreate = mode === 'create';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 text-sm text-[#FF4444]">
          {error}
        </div>
      )}

      {/* Carrier & Load Info */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Carrier & Load</h2>

        <Field label="Carrier Name" required>
          <input
            type="text"
            value={form.carrierName}
            onChange={(e) => set('carrierName', e.target.value)}
            placeholder="Apex Freight Solutions"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Load Reference #">
          <input
            type="text"
            value={form.loadRef}
            onChange={(e) => set('loadRef', e.target.value)}
            placeholder="LD-10041"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Payment Details */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Payment Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Gross Amount ($)" required>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="4200.00"
              min="0"
              step="0.01"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Pay Type" required>
            <select
              value={form.payType}
              onChange={(e) => set('payType', e.target.value as PaymentFormData['payType'])}
              className={inputClass}
            >
              <option value="standard">Standard</option>
              <option value="quick_pay">Quick Pay</option>
              <option value="hold">Hold</option>
            </select>
          </Field>
        </div>

        {form.payType === 'quick_pay' && (
          <div className="rounded-xl bg-[#00C650]/5 border border-[#00C650]/20 p-4 space-y-3">
            <Field label="Quick Pay Discount (%)">
              <input
                type="number"
                value={form.quickPayDiscount}
                onChange={(e) => set('quickPayDiscount', e.target.value)}
                placeholder="2.0"
                min="0"
                max="100"
                step="0.1"
                className={inputClass}
              />
            </Field>
            {netAmount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8B95A5]">Net amount after discount:</span>
                <span className="text-[#00C650] font-bold text-lg">
                  ${netAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {form.payType !== 'quick_pay' && netAmount != null && (
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-[#8B95A5]">Net amount:</span>
            <span className="text-white font-semibold">${netAmount.toFixed(2)}</span>
          </div>
        )}

        <Field label="Scheduled Date">
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(e) => set('scheduledDate', e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Notes</h2>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Internal notes — POD status, dispute details, instructions..."
          rows={3}
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          {loading
            ? isCreate ? 'Creating...' : 'Saving...'
            : isCreate ? 'Create Payment' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
