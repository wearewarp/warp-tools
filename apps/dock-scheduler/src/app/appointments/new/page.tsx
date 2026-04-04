'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { DockDoor } from '@/db/schema';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { ConflictWarning } from '@/components/ConflictWarning';

interface Conflict {
  id: number;
  carrier_name: string | null;
  scheduled_time: string;
  end_time: string | null;
  status: string;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];

function InputField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">
        {label}{required && <span className="text-[#FF4444] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650]"
    />
  );
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [doors, setDoors] = useState<DockDoor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Form state
  const [dockDoorId, setDockDoorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [appointmentType, setAppointmentType] = useState<'inbound' | 'outbound'>('inbound');
  const [carrierName, setCarrierName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loadRef, setLoadRef] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [commodity, setCommodity] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetch('/api/dock-doors')
      .then((r) => r.json())
      .then((d) => setDoors(d.doors ?? []));
  }, []);

  const checkConflicts = useCallback(async () => {
    if (!dockDoorId || !scheduledDate || !scheduledTime || !durationMinutes) {
      setConflicts([]);
      return;
    }
    setCheckingConflicts(true);
    try {
      const params = new URLSearchParams({
        dock_door_id: dockDoorId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: String(durationMinutes),
      });
      const res = await fetch(`/api/appointments/check-conflicts?${params}`);
      const data = await res.json();
      setConflicts(data.conflicts ?? []);
    } finally {
      setCheckingConflicts(false);
    }
  }, [dockDoorId, scheduledDate, scheduledTime, durationMinutes]);

  useEffect(() => {
    const timer = setTimeout(checkConflicts, 400);
    return () => clearTimeout(timer);
  }, [checkConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dockDoorId || !scheduledDate || !scheduledTime) {
      setError('Dock door, date, and time are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dock_door_id: parseInt(dockDoorId, 10),
          appointment_type: appointmentType,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          duration_minutes: durationMinutes,
          carrier_name: carrierName || null,
          driver_name: driverName || null,
          truck_number: truckNumber || null,
          trailer_number: trailerNumber || null,
          driver_phone: driverPhone || null,
          load_ref: loadRef || null,
          po_number: poNumber || null,
          commodity: commodity || null,
          special_instructions: specialInstructions || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setConflicts(data.conflicts ?? []);
          setError('Scheduling conflict — see below');
        } else {
          setError(data.error ?? 'Failed to create appointment');
        }
        return;
      }
      router.push('/appointments');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const activeDoors = doors.filter((d) => d.status === 'active');

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Appointment</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Schedule a new dock appointment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Schedule */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Schedule</div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Dock Door" required>
              <select
                value={dockDoorId}
                onChange={(e) => setDockDoorId(e.target.value)}
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650]"
              >
                <option value="">Select door…</option>
                {activeDoors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.door_type})
                  </option>
                ))}
              </select>
            </InputField>
            <InputField label="Date" required>
              <TextInput type="date" value={scheduledDate} onChange={setScheduledDate} />
            </InputField>
            <InputField label="Start Time" required>
              <TimeSlotPicker value={scheduledTime} onChange={setScheduledTime} />
            </InputField>
            <InputField label="Duration" required>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650]"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </InputField>
          </div>

          {/* Type */}
          <InputField label="Appointment Type" required>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${appointmentType === 'inbound' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-[#1A2235] text-[#8B95A5] hover:border-[#2A3448]'}`}>
                <input
                  type="radio"
                  name="type"
                  value="inbound"
                  checked={appointmentType === 'inbound'}
                  onChange={() => setAppointmentType('inbound')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Inbound</span>
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${appointmentType === 'outbound' ? 'border-purple-400 bg-purple-400/10 text-purple-400' : 'border-[#1A2235] text-[#8B95A5] hover:border-[#2A3448]'}`}>
                <input
                  type="radio"
                  name="type"
                  value="outbound"
                  checked={appointmentType === 'outbound'}
                  onChange={() => setAppointmentType('outbound')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Outbound</span>
              </label>
            </div>
          </InputField>

          {/* Conflict warning */}
          {checkingConflicts && (
            <div className="text-xs text-[#8B95A5]">Checking for conflicts…</div>
          )}
          <ConflictWarning conflicts={conflicts} />
        </div>

        {/* Carrier Info */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Carrier</div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Carrier Name">
              <TextInput value={carrierName} onChange={setCarrierName} placeholder="Apex Freight" />
            </InputField>
            <InputField label="Driver Name">
              <TextInput value={driverName} onChange={setDriverName} placeholder="John Smith" />
            </InputField>
            <InputField label="Truck #">
              <TextInput value={truckNumber} onChange={setTruckNumber} placeholder="APX-1234" />
            </InputField>
            <InputField label="Trailer #">
              <TextInput value={trailerNumber} onChange={setTrailerNumber} placeholder="TR-5678" />
            </InputField>
            <InputField label="Driver Phone">
              <TextInput type="tel" value={driverPhone} onChange={setDriverPhone} placeholder="(555) 555-5555" />
            </InputField>
          </div>
        </div>

        {/* Load Info */}
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
          <div className="text-sm font-semibold text-white">Load</div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Load Reference">
              <TextInput value={loadRef} onChange={setLoadRef} placeholder="APX-20240101" />
            </InputField>
            <InputField label="PO Number">
              <TextInput value={poNumber} onChange={setPoNumber} placeholder="PO-55001" />
            </InputField>
            <InputField label="Commodity">
              <TextInput value={commodity} onChange={setCommodity} placeholder="Auto Parts" />
            </InputField>
          </div>
          <InputField label="Special Instructions">
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special handling requirements…"
              rows={3}
              className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650] resize-none"
            />
          </InputField>
        </div>

        {error && (
          <div className="text-sm text-[#FF4444] bg-[#FF4444]/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || conflicts.length > 0}
            className="px-6 py-2.5 rounded-lg bg-[#00C650] text-black text-sm font-medium hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Appointment'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/appointments')}
            className="px-6 py-2.5 rounded-lg bg-[#1A2235] text-white text-sm hover:bg-[#2A3448] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
