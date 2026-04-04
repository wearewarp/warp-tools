'use client';

import { useState } from 'react';
import type { PayType } from '@/db/schema';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';

interface AddTripModalProps {
  driverId: number;
  payType: PayType;
  payRate: number;
  onClose: () => void;
  onAdded: () => void;
}

function calcPay(payType: PayType, rate: number, miles: number, revenue: number, hours: number, stops: number): number {
  switch (payType) {
    case 'per_mile': return rate * miles;
    case 'percentage': return (rate / 100) * revenue;
    case 'flat': return rate;
    case 'hourly': return rate * hours;
    case 'per_stop': return rate * stops;
    default: return 0;
  }
}

function buildFormula(payType: PayType, rate: number, miles: number, revenue: number, hours: number, stops: number): string {
  switch (payType) {
    case 'per_mile': return `$${rate}/mi × ${miles} mi`;
    case 'percentage': return `${rate}% × ${formatCurrency(revenue)}`;
    case 'flat': return `Flat rate`;
    case 'hourly': return `$${rate}/hr × ${hours} hrs`;
    case 'per_stop': return `$${rate}/stop × ${stops} stops`;
    default: return '';
  }
}

export function AddTripModal({ driverId, payType, payRate, onClose, onAdded }: AddTripModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const [miles, setMiles] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [hours, setHours] = useState(0);
  const [stops, setStops] = useState(1);

  const payAmount = calcPay(payType, payRate, miles, revenue, hours, stops);
  const formula = buildFormula(payType, payRate, miles, revenue, hours, stops);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    data.driver_id = String(driverId);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to add trip');
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
      <div className="relative w-full max-w-lg rounded-xl bg-[#0C1528] border border-[#1A2235] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-base font-semibold text-white">Add Trip</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Load Ref" name="load_ref" placeholder="LD-1234" />
            <ModalField label="Trip Date" name="trip_date" type="date" defaultValue={today} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Origin City" name="origin_city" required />
            <ModalField label="Origin State" name="origin_state" placeholder="IL" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ModalField label="Dest City" name="dest_city" required />
            <ModalField label="Dest State" name="dest_state" placeholder="TX" required />
          </div>

          {/* Pay-type specific fields */}
          {(payType === 'per_mile' || payType === 'percentage' || payType === 'flat') && (
            <ModalField
              label="Miles"
              name="miles"
              type="number"
              step="1"
              min="0"
              value={String(miles)}
              onChange={v => setMiles(parseFloat(v) || 0)}
            />
          )}

          {payType === 'percentage' && (
            <ModalField
              label="Load Revenue ($)"
              name="revenue"
              type="number"
              step="0.01"
              min="0"
              value={String(revenue)}
              onChange={v => setRevenue(parseFloat(v) || 0)}
              required
            />
          )}

          {payType === 'hourly' && (
            <ModalField
              label="Hours Driven"
              name="hours"
              type="number"
              step="0.5"
              min="0"
              value={String(hours)}
              onChange={v => setHours(parseFloat(v) || 0)}
              required
            />
          )}

          {payType === 'per_stop' && (
            <ModalField
              label="Number of Stops"
              name="stops"
              type="number"
              step="1"
              min="1"
              value={String(stops)}
              onChange={v => setStops(parseInt(v) || 1)}
              required
            />
          )}

          {/* Live pay calc */}
          <div className="flex items-center justify-between rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 px-4 py-3">
            <span className="text-xs text-[#8B95A5]">{formula}</span>
            <span className="text-[#00C650] font-semibold font-mono">{formatCurrency(payAmount)}</span>
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
              {saving ? 'Adding...' : 'Add Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  name,
  type = 'text',
  defaultValue,
  value,
  onChange,
  required,
  placeholder,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#8B95A5] uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={onChange ? undefined : defaultValue}
        value={onChange ? value : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        className="w-full h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] px-3 focus:outline-none focus:border-[#00C650]/50"
      />
    </div>
  );
}
