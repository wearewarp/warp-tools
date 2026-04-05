'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { Shipment } from '@/db/schema';
import { getEquipmentLabel } from '@/lib/utils';

const EQUIPMENT_OPTIONS = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'lowboy', label: 'Lowboy' },
  { value: 'sprinter_van', label: 'Sprinter Van' },
  { value: 'cargo_van', label: 'Cargo Van' },
  { value: 'power_only', label: 'Power Only' },
];

const inputClass =
  'w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] mb-1">{label}</label>
      {children}
    </div>
  );
}

export function EditShipmentForm({ shipment }: { shipment: Shipment }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName: shipment.customerName,
    originCity: shipment.originCity,
    originState: shipment.originState,
    originZip: shipment.originZip ?? '',
    destCity: shipment.destCity,
    destState: shipment.destState,
    destZip: shipment.destZip ?? '',
    equipmentType: shipment.equipmentType,
    pickupDate: shipment.pickupDate ?? '',
    deliveryDate: shipment.deliveryDate ?? '',
    customerRate: String(shipment.customerRate ?? ''),
    carrierRate: String(shipment.carrierRate ?? ''),
    rateType: shipment.rateType ?? 'flat',
    miles: String(shipment.miles ?? ''),
    carrierName: shipment.carrierName ?? '',
    carrierContact: shipment.carrierContact ?? '',
    carrierPhone: shipment.carrierPhone ?? '',
    commodity: shipment.commodity ?? '',
    weight: String(shipment.weight ?? ''),
    specialInstructions: shipment.specialInstructions ?? '',
    notes: shipment.notes ?? '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { ...form };
      if (body.customerRate) body.customerRate = parseFloat(body.customerRate as string);
      if (body.carrierRate) body.carrierRate = parseFloat(body.carrierRate as string);
      if (body.miles) body.miles = parseFloat(body.miles as string);
      if (body.weight) body.weight = parseFloat(body.weight as string);

      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(`/shipments/${shipment.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/shipments/${shipment.id}`} className="text-[#8B95A5] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit {shipment.shipmentNumber}</h1>
          <p className="text-[#8B95A5] text-sm mt-1">Update shipment details</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-white">Customer & Route</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer Name"><input className={inputClass} value={form.customerName} onChange={(e) => update('customerName', e.target.value)} /></Field>
          <Field label="Equipment Type">
            <select className={inputClass} value={form.equipmentType} onChange={(e) => update('equipmentType', e.target.value)}>
              {EQUIPMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Origin City"><input className={inputClass} value={form.originCity} onChange={(e) => update('originCity', e.target.value)} /></Field>
          <Field label="Origin State"><input className={inputClass} value={form.originState} onChange={(e) => update('originState', e.target.value)} /></Field>
          <Field label="Origin Zip"><input className={inputClass} value={form.originZip} onChange={(e) => update('originZip', e.target.value)} /></Field>
          <Field label="Dest City"><input className={inputClass} value={form.destCity} onChange={(e) => update('destCity', e.target.value)} /></Field>
          <Field label="Dest State"><input className={inputClass} value={form.destState} onChange={(e) => update('destState', e.target.value)} /></Field>
          <Field label="Dest Zip"><input className={inputClass} value={form.destZip} onChange={(e) => update('destZip', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pickup Date"><input type="date" className={inputClass} value={form.pickupDate} onChange={(e) => update('pickupDate', e.target.value)} /></Field>
          <Field label="Delivery Date"><input type="date" className={inputClass} value={form.deliveryDate} onChange={(e) => update('deliveryDate', e.target.value)} /></Field>
        </div>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-white">Financials & Carrier</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Customer Rate ($)"><input type="number" step="0.01" className={inputClass} value={form.customerRate} onChange={(e) => update('customerRate', e.target.value)} /></Field>
          <Field label="Carrier Rate ($)"><input type="number" step="0.01" className={inputClass} value={form.carrierRate} onChange={(e) => update('carrierRate', e.target.value)} /></Field>
          <Field label="Miles"><input type="number" className={inputClass} value={form.miles} onChange={(e) => update('miles', e.target.value)} /></Field>
          <Field label="Rate Type">
            <select className={inputClass} value={form.rateType} onChange={(e) => update('rateType', e.target.value)}>
              <option value="flat">Flat</option><option value="per_mile">Per Mile</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Carrier Name"><input className={inputClass} value={form.carrierName} onChange={(e) => update('carrierName', e.target.value)} /></Field>
          <Field label="Carrier Contact"><input className={inputClass} value={form.carrierContact} onChange={(e) => update('carrierContact', e.target.value)} /></Field>
          <Field label="Carrier Phone"><input className={inputClass} value={form.carrierPhone} onChange={(e) => update('carrierPhone', e.target.value)} /></Field>
        </div>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Commodity"><input className={inputClass} value={form.commodity} onChange={(e) => update('commodity', e.target.value)} /></Field>
          <Field label="Weight (lbs)"><input type="number" className={inputClass} value={form.weight} onChange={(e) => update('weight', e.target.value)} /></Field>
        </div>
        <Field label="Special Instructions"><textarea className={`${inputClass} h-20 resize-none`} value={form.specialInstructions} onChange={(e) => update('specialInstructions', e.target.value)} /></Field>
        <Field label="Notes"><textarea className={`${inputClass} h-20 resize-none`} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></Field>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href={`/shipments/${shipment.id}`} className="px-4 py-2.5 text-sm text-[#8B95A5] hover:text-white transition-colors">Cancel</Link>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-[#00C650] hover:bg-[#00B045] disabled:opacity-50 text-black font-medium text-sm px-5 py-2.5 rounded-lg transition-colors">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
