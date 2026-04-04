'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { EQUIPMENT_TYPES, RATE_TYPES, type Load } from '@/db/schema';
import { getEquipmentLabel } from '@/lib/utils';

interface Props {
  load?: Load;
}

function Input({
  label, name, type = 'text', value, onChange, placeholder, required, step, min,
}: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; step?: string; min?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 mb-4 border-b border-[#1A2235]">
      <h2 className="text-sm font-semibold text-[#00C650] uppercase tracking-wide">{children}</h2>
    </div>
  );
}

export function LoadForm({ load }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [f, setF] = useState({
    customer_name: load?.customer_name ?? '',
    customer_ref: load?.customer_ref ?? '',
    // Origin
    origin_city: load?.origin_city ?? '',
    origin_state: load?.origin_state ?? '',
    origin_zip: load?.origin_zip ?? '',
    origin_address: load?.origin_address ?? '',
    origin_contact_name: load?.origin_contact_name ?? '',
    origin_contact_phone: load?.origin_contact_phone ?? '',
    pickup_date: load?.pickup_date ?? '',
    pickup_time_from: load?.pickup_time_from ?? '',
    pickup_time_to: load?.pickup_time_to ?? '',
    pickup_number: load?.pickup_number ?? '',
    // Destination
    dest_city: load?.dest_city ?? '',
    dest_state: load?.dest_state ?? '',
    dest_zip: load?.dest_zip ?? '',
    dest_address: load?.dest_address ?? '',
    dest_contact_name: load?.dest_contact_name ?? '',
    dest_contact_phone: load?.dest_contact_phone ?? '',
    delivery_date: load?.delivery_date ?? '',
    delivery_time_from: load?.delivery_time_from ?? '',
    delivery_time_to: load?.delivery_time_to ?? '',
    delivery_number: load?.delivery_number ?? '',
    // Freight
    equipment_type: load?.equipment_type ?? 'dry_van',
    weight: load?.weight ? String(load.weight) : '',
    commodity: load?.commodity ?? '',
    temperature_min: load?.temperature_min ? String(load.temperature_min) : '',
    temperature_max: load?.temperature_max ? String(load.temperature_max) : '',
    dims_length: load?.dims_length ? String(load.dims_length) : '',
    dims_width: load?.dims_width ? String(load.dims_width) : '',
    dims_height: load?.dims_height ? String(load.dims_height) : '',
    special_instructions: load?.special_instructions ?? '',
    // Financials
    customer_rate: load?.customer_rate ? String(load.customer_rate) : '',
    rate_type: load?.rate_type ?? 'flat',
    miles: load?.miles ? String(load.miles) : '',
    // Notes
    notes: load?.notes ?? '',
    bol_number: load?.bol_number ?? '',
    pro_number: load?.pro_number ?? '',
  });

  function set(field: string, value: string) {
    setF((prev) => ({ ...prev, [field]: value }));
  }

  const isReefer = f.equipment_type === 'reefer';

  async function handleSubmit(e: React.FormEvent, status = 'new') {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        customer_name: f.customer_name,
        customer_ref: f.customer_ref || null,
        status,
        origin_city: f.origin_city,
        origin_state: f.origin_state,
        origin_zip: f.origin_zip || null,
        origin_address: f.origin_address || null,
        origin_contact_name: f.origin_contact_name || null,
        origin_contact_phone: f.origin_contact_phone || null,
        pickup_date: f.pickup_date || null,
        pickup_time_from: f.pickup_time_from || null,
        pickup_time_to: f.pickup_time_to || null,
        pickup_number: f.pickup_number || null,
        dest_city: f.dest_city,
        dest_state: f.dest_state,
        dest_zip: f.dest_zip || null,
        dest_address: f.dest_address || null,
        dest_contact_name: f.dest_contact_name || null,
        dest_contact_phone: f.dest_contact_phone || null,
        delivery_date: f.delivery_date || null,
        delivery_time_from: f.delivery_time_from || null,
        delivery_time_to: f.delivery_time_to || null,
        delivery_number: f.delivery_number || null,
        equipment_type: f.equipment_type,
        weight: f.weight ? parseInt(f.weight, 10) : null,
        commodity: f.commodity || null,
        temperature_min: isReefer && f.temperature_min ? parseFloat(f.temperature_min) : null,
        temperature_max: isReefer && f.temperature_max ? parseFloat(f.temperature_max) : null,
        dims_length: f.dims_length ? parseFloat(f.dims_length) : null,
        dims_width: f.dims_width ? parseFloat(f.dims_width) : null,
        dims_height: f.dims_height ? parseFloat(f.dims_height) : null,
        special_instructions: f.special_instructions || null,
        customer_rate: f.customer_rate ? parseFloat(f.customer_rate) : null,
        rate_type: f.rate_type,
        miles: f.miles ? parseInt(f.miles, 10) : null,
        notes: f.notes || null,
        bol_number: f.bol_number || null,
        pro_number: f.pro_number || null,
      };

      let res: Response;
      if (load) {
        res = await fetch(`/api/loads/${load.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/loads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Save failed', type: 'error' });
        return;
      }

      const data = await res.json();
      const savedLoad = data.load;

      toast({
        message: load
          ? `Load ${savedLoad.load_number} updated`
          : `Load ${savedLoad.load_number} created`,
        type: 'success',
      });

      router.push(`/loads/${savedLoad.id}`);
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, load?.status ?? 'new')} className="space-y-8">

      {/* Customer */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>Customer</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Customer Name" name="customer_name" value={f.customer_name} onChange={(v) => set('customer_name', v)} placeholder="Dallas Distribution Co." required />
          <Input label="Customer Reference / PO#" name="customer_ref" value={f.customer_ref} onChange={(v) => set('customer_ref', v)} placeholder="DD-9901" />
        </div>
      </div>

      {/* Origin */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>Pickup (Origin)</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <Input label="City" name="origin_city" value={f.origin_city} onChange={(v) => set('origin_city', v)} placeholder="Dallas" required />
          <Input label="State" name="origin_state" value={f.origin_state} onChange={(v) => set('origin_state', v)} placeholder="TX" required />
          <Input label="ZIP" name="origin_zip" value={f.origin_zip} onChange={(v) => set('origin_zip', v)} placeholder="75201" />
        </div>
        <Input label="Address" name="origin_address" value={f.origin_address} onChange={(v) => set('origin_address', v)} placeholder="1234 Commerce St" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Name" name="origin_contact_name" value={f.origin_contact_name} onChange={(v) => set('origin_contact_name', v)} placeholder="Mike Torres" />
          <Input label="Contact Phone" name="origin_contact_phone" type="tel" value={f.origin_contact_phone} onChange={(v) => set('origin_contact_phone', v)} placeholder="214-555-0101" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Pickup Date" name="pickup_date" type="date" value={f.pickup_date} onChange={(v) => set('pickup_date', v)} />
          <Input label="Time From" name="pickup_time_from" type="time" value={f.pickup_time_from} onChange={(v) => set('pickup_time_from', v)} />
          <Input label="Time To" name="pickup_time_to" type="time" value={f.pickup_time_to} onChange={(v) => set('pickup_time_to', v)} />
        </div>
        <Input label="Pickup / Appointment #" name="pickup_number" value={f.pickup_number} onChange={(v) => set('pickup_number', v)} placeholder="PU-88201" />
      </div>

      {/* Destination */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>Delivery (Destination)</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <Input label="City" name="dest_city" value={f.dest_city} onChange={(v) => set('dest_city', v)} placeholder="Los Angeles" required />
          <Input label="State" name="dest_state" value={f.dest_state} onChange={(v) => set('dest_state', v)} placeholder="CA" required />
          <Input label="ZIP" name="dest_zip" value={f.dest_zip} onChange={(v) => set('dest_zip', v)} placeholder="90001" />
        </div>
        <Input label="Address" name="dest_address" value={f.dest_address} onChange={(v) => set('dest_address', v)} placeholder="5678 Industrial Blvd" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Contact Name" name="dest_contact_name" value={f.dest_contact_name} onChange={(v) => set('dest_contact_name', v)} placeholder="Ana Reyes" />
          <Input label="Contact Phone" name="dest_contact_phone" type="tel" value={f.dest_contact_phone} onChange={(v) => set('dest_contact_phone', v)} placeholder="310-555-0202" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Delivery Date" name="delivery_date" type="date" value={f.delivery_date} onChange={(v) => set('delivery_date', v)} />
          <Input label="Time From" name="delivery_time_from" type="time" value={f.delivery_time_from} onChange={(v) => set('delivery_time_from', v)} />
          <Input label="Time To" name="delivery_time_to" type="time" value={f.delivery_time_to} onChange={(v) => set('delivery_time_to', v)} />
        </div>
        <Input label="Delivery / Appointment #" name="delivery_number" value={f.delivery_number} onChange={(v) => set('delivery_number', v)} placeholder="DEL-44101" />
      </div>

      {/* Freight */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>Freight Details</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Equipment Type *</label>
            <select
              value={f.equipment_type}
              onChange={(e) => set('equipment_type', e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00C650]/50"
            >
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>{getEquipmentLabel(t)}</option>
              ))}
            </select>
          </div>
          <Input label="Weight (lbs)" name="weight" type="number" min="0" value={f.weight} onChange={(v) => set('weight', v)} placeholder="42000" />
        </div>
        <Input label="Commodity" name="commodity" value={f.commodity} onChange={(v) => set('commodity', v)} placeholder="General Merchandise" />
        {isReefer && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Temp Min (°F)" name="temperature_min" type="number" step="1" value={f.temperature_min} onChange={(v) => set('temperature_min', v)} placeholder="34" />
            <Input label="Temp Max (°F)" name="temperature_max" type="number" step="1" value={f.temperature_max} onChange={(v) => set('temperature_max', v)} placeholder="38" />
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <Input label="Length (ft)" name="dims_length" type="number" step="0.1" value={f.dims_length} onChange={(v) => set('dims_length', v)} placeholder="48" />
          <Input label="Width (ft)" name="dims_width" type="number" step="0.1" value={f.dims_width} onChange={(v) => set('dims_width', v)} placeholder="8.5" />
          <Input label="Height (ft)" name="dims_height" type="number" step="0.1" value={f.dims_height} onChange={(v) => set('dims_height', v)} placeholder="9" />
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Special Instructions</label>
          <textarea
            value={f.special_instructions}
            onChange={(e) => set('special_instructions', e.target.value)}
            placeholder="Tarping required, temp restrictions, etc."
            className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none h-20"
          />
        </div>
      </div>

      {/* Financials */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>Financials</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Customer Rate ($)" name="customer_rate" type="number" step="0.01" min="0" value={f.customer_rate} onChange={(v) => set('customer_rate', v)} placeholder="4200" />
          <div>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Rate Type</label>
            <select
              value={f.rate_type}
              onChange={(e) => set('rate_type', e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#00C650]/50"
            >
              {RATE_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'per_mile' ? 'Per Mile' : 'Flat Rate'}</option>
              ))}
            </select>
          </div>
          <Input label="Miles" name="miles" type="number" min="0" value={f.miles} onChange={(v) => set('miles', v)} placeholder="1430" />
        </div>
      </div>

      {/* References & Notes */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-5 space-y-4">
        <SectionHeader>References &amp; Notes</SectionHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input label="BOL Number" name="bol_number" value={f.bol_number} onChange={(v) => set('bol_number', v)} placeholder="BOL-88201" />
          <Input label="PRO Number" name="pro_number" value={f.pro_number} onChange={(v) => set('pro_number', v)} placeholder="PRO-10001" />
        </div>
        <div>
          <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Notes</label>
          <textarea
            value={f.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Internal notes…"
            className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none h-24"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : load ? 'Save Changes' : 'Create Load'}
        </button>
        {!load && (
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'posted')}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save &amp; Post'}
          </button>
        )}
      </div>
    </form>
  );
}
