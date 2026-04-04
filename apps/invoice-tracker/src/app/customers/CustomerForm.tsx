'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface CustomerFormData {
  name: string;
  billingContact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'quick_pay' | 'factored';
  creditLimit: string;
  notes: string;
  status: 'active' | 'inactive' | 'on_hold';
}

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customerId?: string;
  initialData?: Partial<CustomerFormData>;
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
        {label} {required && <span className="text-[#FF4444]">*</span>}
      </label>
      {children}
    </div>
  );
}

export function CustomerForm({ mode, customerId, initialData }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CustomerFormData>({
    name: initialData?.name ?? '',
    billingContact: initialData?.billingContact ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    address: initialData?.address ?? '',
    paymentTerms: initialData?.paymentTerms ?? 'net_30',
    creditLimit: initialData?.creditLimit ?? '',
    notes: initialData?.notes ?? '',
    status: initialData?.status ?? 'active',
  });

  function set(key: keyof CustomerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name,
      billingContact: form.billingContact || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      paymentTerms: form.paymentTerms,
      creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : null,
      notes: form.notes || null,
      status: form.status,
    };

    try {
      const url = mode === 'create' ? '/api/customers' : `/api/customers/${customerId}`;
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
            : data.error?.formErrors?.[0] ?? `Failed to ${mode === 'create' ? 'create' : 'update'} customer`;
        setError(msg);
        toast({ message: msg, type: 'error' });
        return;
      }

      const customer = await res.json();
      const successMsg = mode === 'create' ? 'Customer created successfully' : 'Customer updated successfully';
      toast({ message: successMsg, type: 'success' });
      router.push(`/customers/${customer.id}`);
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

      {/* Basic Info */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Basic Information</h2>

        <Field label="Company Name" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Dallas Distribution Co"
            required
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Billing Contact">
            <input
              type="text"
              value={form.billingContact}
              onChange={(e) => set('billingContact', e.target.value)}
              placeholder="Karen Mitchell"
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="billing@company.com"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="214-555-0182"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Address */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Address</h2>
        <Field label="Full Address">
          <input
            type="text"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="8800 Commerce Park Dr, Dallas, TX 75247"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Billing */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Billing</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Payment Terms">
            <select
              value={form.paymentTerms}
              onChange={(e) => set('paymentTerms', e.target.value)}
              className={inputClass}
            >
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
              <option value="quick_pay">Quick Pay</option>
              <option value="factored">Factored</option>
            </select>
          </Field>

          <Field label="Credit Limit ($)">
            <input
              type="number"
              value={form.creditLimit}
              onChange={(e) => set('creditLimit', e.target.value)}
              placeholder="150000"
              min="0"
              step="1000"
              className={inputClass}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Internal Notes</h2>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Add any notes about this customer — payment behavior, special requirements, escalation history..."
          rows={4}
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
            : isCreate ? 'Create Customer' : 'Save Changes'}
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
