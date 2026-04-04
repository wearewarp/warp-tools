'use client';

import { useState } from 'react';
import type { PayType } from '@/db/schema';
import { formatCurrency } from '@/lib/utils';

interface TripQuickAddProps {
  driverId: number;
  payType: PayType;
  payRate: number;
  onAdded?: () => void;
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

export function TripQuickAdd({ driverId, payType, payRate, onAdded }: TripQuickAddProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [miles, setMiles] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [hours, setHours] = useState(0);
  const [stops, setStops] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const payAmount = calcPay(payType, payRate, miles, revenue, hours, stops);

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

      form.reset();
      setMiles(0);
      setRevenue(0);
      setHours(0);
      setStops(1);
      onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-4 space-y-3">
      <h3 className="text-xs font-semibold text-white uppercase tracking-wide">Quick Add Trip</h3>
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid grid-cols-3 gap-2">
        <input type="text" name="load_ref" placeholder="Load Ref" className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        <input type="date" name="trip_date" defaultValue={today} required className="h-8 col-span-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <input type="text" name="origin_city" placeholder="Origin City" required className="h-8 col-span-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        <input type="text" name="origin_state" placeholder="ST" required className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        <input type="text" name="dest_state" placeholder="ST" required className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" name="dest_city" placeholder="Dest City" required className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        {(payType === 'per_mile' || payType === 'flat') && (
          <input type="number" name="miles" placeholder="Miles" min="0" value={miles} onChange={e => setMiles(parseFloat(e.target.value) || 0)} className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        )}
        {payType === 'percentage' && (
          <input type="number" name="revenue" placeholder="Revenue $" min="0" step="0.01" required value={revenue} onChange={e => setRevenue(parseFloat(e.target.value) || 0)} className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        )}
        {payType === 'hourly' && (
          <input type="number" name="hours" placeholder="Hours" min="0" step="0.5" required value={hours} onChange={e => setHours(parseFloat(e.target.value) || 0)} className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        )}
        {payType === 'per_stop' && (
          <input type="number" name="stops" placeholder="Stops" min="1" step="1" required value={stops} onChange={e => setStops(parseInt(e.target.value) || 1)} className="h-8 rounded-lg bg-[#0C1528] border border-[#1A2235] text-xs text-white px-2 focus:outline-none focus:border-[#00C650]/50" />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#00C650] font-mono font-semibold">{formatCurrency(payAmount)}</span>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg bg-[#00C650] text-black text-xs font-semibold hover:bg-[#00C650]/90 transition-colors disabled:opacity-60">
          {saving ? 'Adding...' : 'Add Trip'}
        </button>
      </div>
    </form>
  );
}
