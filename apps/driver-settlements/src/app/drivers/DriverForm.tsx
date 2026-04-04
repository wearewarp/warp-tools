'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Driver, PayType } from '@/db/schema';

const PAY_TYPE_OPTIONS: { value: PayType; label: string; hint: string }[] = [
  { value: 'per_mile', label: 'Per Mile', hint: 'e.g. $0.55 per mile driven' },
  { value: 'percentage', label: 'Percentage of Revenue', hint: 'e.g. 25% of load revenue' },
  { value: 'flat', label: 'Flat Rate per Load', hint: 'e.g. $500 per load' },
  { value: 'hourly', label: 'Hourly', hint: 'e.g. $25 per hour' },
  { value: 'per_stop', label: 'Per Stop', hint: 'e.g. $400 per stop' },
];

const RATE_PLACEHOLDER: Record<PayType, string> = {
  per_mile: '0.55',
  percentage: '25',
  flat: '500',
  hourly: '25',
  per_stop: '400',
};

const RATE_SUFFIX: Record<PayType, string> = {
  per_mile: '/mile',
  percentage: '%',
  flat: '/load',
  hourly: '/hr',
  per_stop: '/stop',
};

interface DriverFormProps {
  driver?: Driver;
}

export function DriverForm({ driver }: DriverFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [payType, setPayType] = useState<PayType>(() => (driver?.pay_type ?? 'per_mile'));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const url = driver ? `/api/drivers/${driver.id}` : '/api/drivers';
      const method = driver ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to save driver');
      }

      const saved = await res.json();
      router.push(`/drivers/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  const hint = PAY_TYPE_OPTIONS.find(o => o.value === payType)?.hint ?? '';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Personal Info */}
      <section className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" name="first_name" defaultValue={driver?.first_name} required />
          <Field label="Last Name" name="last_name" defaultValue={driver?.last_name} required />
          <Field label="Email" name="email" type="email" defaultValue={driver?.email ?? ''} />
          <Field label="Phone" name="phone" defaultValue={driver?.phone ?? ''} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Street Address" name="address_street" defaultValue={driver?.address_street ?? ''} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="City" name="address_city" defaultValue={driver?.address_city ?? ''} />
          <Field label="State" name="address_state" defaultValue={driver?.address_state ?? ''} placeholder="IL" />
          <Field label="ZIP" name="address_zip" defaultValue={driver?.address_zip ?? ''} />
        </div>
      </section>

      {/* License */}
      <section className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">CDL License</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="License Number" name="license_number" defaultValue={driver?.license_number ?? ''} />
          <Field label="License State" name="license_state" defaultValue={driver?.license_state ?? ''} placeholder="IL" />
          <Field label="Expiry Date" name="license_expiry" type="date" defaultValue={driver?.license_expiry ?? ''} />
        </div>
      </section>

      {/* Pay Settings */}
      <section className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Pay Settings</h2>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Pay Type</label>
          <div className="grid grid-cols-1 gap-2">
            {PAY_TYPE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  payType === opt.value
                    ? 'border-[#00C650]/40 bg-[#00C650]/5'
                    : 'border-[#1A2235] hover:border-[#2A3245]'
                }`}
              >
                <input
                  type="radio"
                  name="pay_type"
                  value={opt.value}
                  checked={payType === opt.value}
                  onChange={() => setPayType(opt.value)}
                  className="mt-0.5 accent-[#00C650]"
                />
                <div>
                  <div className="text-sm text-white font-medium">{opt.label}</div>
                  <div className="text-xs text-[#8B95A5]">{opt.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Pay Rate</label>
            <div className="relative flex items-center">
              {payType !== 'percentage' && (
                <span className="absolute left-3 text-[#8B95A5] text-sm">$</span>
              )}
              <input
                type="number"
                name="pay_rate"
                step="0.01"
                min="0"
                defaultValue={driver?.pay_rate}
                placeholder={RATE_PLACEHOLDER[payType]}
                required
                className={`w-full h-9 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white focus:outline-none focus:border-[#00C650]/50 pr-16 ${
                  payType !== 'percentage' ? 'pl-7' : 'pl-3'
                }`}
              />
              <span className="absolute right-3 text-[#8B95A5] text-xs">{RATE_SUFFIX[payType]}</span>
            </div>
          </div>
          <Field label="Hire Date" name="hire_date" type="date" defaultValue={driver?.hire_date ?? ''} />
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" name="emergency_contact_name" defaultValue={driver?.emergency_contact_name ?? ''} />
          <Field label="Phone" name="emergency_contact_phone" defaultValue={driver?.emergency_contact_phone ?? ''} />
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Notes</h2>
        <textarea
          name="notes"
          defaultValue={driver?.notes ?? ''}
          rows={3}
          placeholder="Optional notes..."
          className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/50 resize-none"
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border border-[#1A2235] text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-[#00C650] text-black text-sm font-semibold hover:bg-[#00C650]/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : driver ? 'Save Changes' : 'Create Driver'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] px-3 focus:outline-none focus:border-[#00C650]/50"
      />
    </div>
  );
}
