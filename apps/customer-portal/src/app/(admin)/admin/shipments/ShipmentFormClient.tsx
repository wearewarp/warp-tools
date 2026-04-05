'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface Customer {
  id: string;
  name: string;
}

interface Shipment {
  id: string;
  customerId: string | null;
  shipmentNumber: string;
  status: string;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  pieces: number | null;
  originCity: string;
  originState: string;
  originZip: string | null;
  originAddress: string | null;
  originContactName: string | null;
  originContactPhone: string | null;
  destCity: string;
  destState: string;
  destZip: string | null;
  destAddress: string | null;
  destContactName: string | null;
  destContactPhone: string | null;
  pickupDate: string | null;
  pickupTimeWindow: string | null;
  deliveryDate: string | null;
  deliveryTimeWindow: string | null;
  customerRate: number | null;
  invoiceRef: string | null;
  invoiceStatus: string | null;
  invoiceAmount: number | null;
  specialInstructions: string | null;
  bolNumber: string | null;
  poNumber: string | null;
  proNumber: string | null;
}

interface ShipmentFormClientProps {
  mode: 'create' | 'edit';
  shipment?: Shipment;
  customers: Customer[];
  preselectedCustomerId?: string;
}

const EQUIPMENT_TYPES = ['dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy', 'sprinter_van', 'cargo_van', 'power_only'];
const STATUSES = ['quote', 'booked', 'in_transit', 'at_pickup', 'at_delivery', 'delivered', 'invoiced', 'closed', 'cancelled'];

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = 'w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none';
const selectClass = 'w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none';

export function ShipmentFormClient({ mode, shipment, customers, preselectedCustomerId }: ShipmentFormClientProps) {
  const [customerId, setCustomerId] = useState(() => shipment?.customerId ?? preselectedCustomerId ?? '');
  const [shipmentNumber, setShipmentNumber] = useState(() => shipment?.shipmentNumber ?? '');
  const [status, setStatus] = useState(() => shipment?.status ?? 'booked');
  const [equipmentType, setEquipmentType] = useState(() => shipment?.equipmentType ?? '');
  const [commodity, setCommodity] = useState(() => shipment?.commodity ?? '');
  const [weight, setWeight] = useState(() => shipment?.weight?.toString() ?? '');
  const [pieces, setPieces] = useState(() => shipment?.pieces?.toString() ?? '');
  const [originCity, setOriginCity] = useState(() => shipment?.originCity ?? '');
  const [originState, setOriginState] = useState(() => shipment?.originState ?? '');
  const [originZip, setOriginZip] = useState(() => shipment?.originZip ?? '');
  const [originAddress, setOriginAddress] = useState(() => shipment?.originAddress ?? '');
  const [originContactName, setOriginContactName] = useState(() => shipment?.originContactName ?? '');
  const [originContactPhone, setOriginContactPhone] = useState(() => shipment?.originContactPhone ?? '');
  const [destCity, setDestCity] = useState(() => shipment?.destCity ?? '');
  const [destState, setDestState] = useState(() => shipment?.destState ?? '');
  const [destZip, setDestZip] = useState(() => shipment?.destZip ?? '');
  const [destAddress, setDestAddress] = useState(() => shipment?.destAddress ?? '');
  const [destContactName, setDestContactName] = useState(() => shipment?.destContactName ?? '');
  const [destContactPhone, setDestContactPhone] = useState(() => shipment?.destContactPhone ?? '');
  const [pickupDate, setPickupDate] = useState(() => shipment?.pickupDate ?? '');
  const [pickupTimeWindow, setPickupTimeWindow] = useState(() => shipment?.pickupTimeWindow ?? '');
  const [deliveryDate, setDeliveryDate] = useState(() => shipment?.deliveryDate ?? '');
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState(() => shipment?.deliveryTimeWindow ?? '');
  const [customerRate, setCustomerRate] = useState(() => shipment?.customerRate?.toString() ?? '');
  const [invoiceRef, setInvoiceRef] = useState(() => shipment?.invoiceRef ?? '');
  const [invoiceAmount, setInvoiceAmount] = useState(() => shipment?.invoiceAmount?.toString() ?? '');
  const [invoiceStatus, setInvoiceStatus] = useState(() => shipment?.invoiceStatus ?? 'pending');
  const [bolNumber, setBolNumber] = useState(() => shipment?.bolNumber ?? '');
  const [poNumber, setPoNumber] = useState(() => shipment?.poNumber ?? '');
  const [proNumber, setProNumber] = useState(() => shipment?.proNumber ?? '');
  const [specialInstructions, setSpecialInstructions] = useState(() => shipment?.specialInstructions ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!originCity.trim()) newErrors.originCity = 'Origin city is required';
    if (!originState.trim()) newErrors.originState = 'Origin state is required';
    if (!destCity.trim()) newErrors.destCity = 'Destination city is required';
    if (!destState.trim()) newErrors.destState = 'Destination state is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const payload = {
      customerId: customerId || null,
      shipmentNumber: shipmentNumber || undefined,
      status,
      equipmentType: equipmentType || null,
      commodity: commodity || null,
      weight: weight ? Number(weight) : null,
      pieces: pieces ? Number(pieces) : null,
      originCity, originState, originZip, originAddress, originContactName, originContactPhone,
      destCity, destState, destZip, destAddress, destContactName, destContactPhone,
      pickupDate: pickupDate || null,
      pickupTimeWindow: pickupTimeWindow || null,
      deliveryDate: deliveryDate || null,
      deliveryTimeWindow: deliveryTimeWindow || null,
      customerRate: customerRate ? Number(customerRate) : null,
      invoiceRef: invoiceRef || null,
      invoiceAmount: invoiceAmount ? Number(invoiceAmount) : null,
      invoiceStatus,
      bolNumber: bolNumber || null,
      poNumber: poNumber || null,
      proNumber: proNumber || null,
      specialInstructions: specialInstructions || null,
    };

    try {
      const url = mode === 'create' ? '/api/admin/shipments' : `/api/admin/shipments/${shipment!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(mode === 'create' ? 'Shipment created' : 'Shipment updated');
        router.push(`/admin/shipments/${data.shipment.id}`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Something went wrong', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={mode === 'edit' ? `/admin/shipments/${shipment!.id}` : '/admin/shipments'}
          className="p-2 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {mode === 'create' ? 'New Shipment' : `Edit ${shipment!.shipmentNumber}`}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basics */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={selectClass}>
                <option value="">No customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Shipment Number">
              <input type="text" value={shipmentNumber} onChange={(e) => setShipmentNumber(e.target.value)} placeholder="Auto-generated if blank" className={inputClass} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Equipment Type">
              <select value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} className={selectClass}>
                <option value="">Select type</option>
                {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Freight */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Freight</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Commodity">
              <input type="text" value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g., Electronics" className={inputClass} />
            </Field>
            <Field label="Weight (lbs)">
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
            <Field label="Pieces">
              <input type="number" value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder="0" className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Origin */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Origin / Pickup</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required error={errors.originCity}>
              <input type="text" value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder="Chicago" className={inputClass} />
            </Field>
            <Field label="State" required error={errors.originState}>
              <input type="text" value={originState} onChange={(e) => setOriginState(e.target.value)} placeholder="IL" maxLength={2} className={inputClass} />
            </Field>
            <Field label="ZIP">
              <input type="text" value={originZip} onChange={(e) => setOriginZip(e.target.value)} placeholder="60601" className={inputClass} />
            </Field>
            <Field label="Address">
              <input type="text" value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="123 Main St" className={inputClass} />
            </Field>
            <Field label="Contact Name">
              <input type="text" value={originContactName} onChange={(e) => setOriginContactName(e.target.value)} placeholder="Warehouse contact" className={inputClass} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={originContactPhone} onChange={(e) => setOriginContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
            </Field>
            <Field label="Pickup Date">
              <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Pickup Time Window">
              <input type="text" value={pickupTimeWindow} onChange={(e) => setPickupTimeWindow(e.target.value)} placeholder="8AM - 12PM" className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Destination */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Destination / Delivery</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" required error={errors.destCity}>
              <input type="text" value={destCity} onChange={(e) => setDestCity(e.target.value)} placeholder="Los Angeles" className={inputClass} />
            </Field>
            <Field label="State" required error={errors.destState}>
              <input type="text" value={destState} onChange={(e) => setDestState(e.target.value)} placeholder="CA" maxLength={2} className={inputClass} />
            </Field>
            <Field label="ZIP">
              <input type="text" value={destZip} onChange={(e) => setDestZip(e.target.value)} placeholder="90001" className={inputClass} />
            </Field>
            <Field label="Address">
              <input type="text" value={destAddress} onChange={(e) => setDestAddress(e.target.value)} placeholder="456 Commerce Ave" className={inputClass} />
            </Field>
            <Field label="Contact Name">
              <input type="text" value={destContactName} onChange={(e) => setDestContactName(e.target.value)} placeholder="Receiving contact" className={inputClass} />
            </Field>
            <Field label="Contact Phone">
              <input type="tel" value={destContactPhone} onChange={(e) => setDestContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
            </Field>
            <Field label="Delivery Date">
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Delivery Time Window">
              <input type="text" value={deliveryTimeWindow} onChange={(e) => setDeliveryTimeWindow(e.target.value)} placeholder="1PM - 5PM" className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Reference Numbers */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Reference Numbers</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="BOL #">
              <input type="text" value={bolNumber} onChange={(e) => setBolNumber(e.target.value)} className={inputClass} />
            </Field>
            <Field label="PO #">
              <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputClass} />
            </Field>
            <Field label="PRO #">
              <input type="text" value={proNumber} onChange={(e) => setProNumber(e.target.value)} className={inputClass} />
            </Field>
          </div>
        </div>

        {/* Financials */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Financials</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer Rate ($)">
              <input type="number" step="0.01" value={customerRate} onChange={(e) => setCustomerRate(e.target.value)} placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Invoice Amount ($)">
              <input type="number" step="0.01" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} placeholder="0.00" className={inputClass} />
            </Field>
            <Field label="Invoice Ref">
              <input type="text" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Invoice Status">
              <select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)} className={selectClass}>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Special instructions */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
          <Field label="Special Instructions">
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special handling requirements..."
              rows={3}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none resize-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href={mode === 'edit' ? `/admin/shipments/${shipment!.id}` : '/admin/shipments'}
            className="px-4 py-2 text-sm font-medium text-slate-200 border border-[#1A2235] rounded-lg hover:bg-[#1A2235] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#00C650] text-white rounded-lg hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === 'create' ? 'Create Shipment' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
