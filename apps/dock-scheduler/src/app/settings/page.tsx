'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import type { DockDoor, DoorType, DoorStatus } from '@/db/schema';

interface FacilityData {
  id: number;
  name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  operating_hours_start: string;
  operating_hours_end: string;
  timezone: string;
  buffer_minutes: number;
  notes: string | null;
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">{label}</label>
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

const DOOR_TYPE_OPTIONS: DoorType[] = ['inbound', 'outbound', 'both'];

interface DoorEditState {
  id?: number;
  name: string;
  door_type: DoorType;
  status: DoorStatus;
  notes: string;
  isNew?: boolean;
  saving?: boolean;
}

export default function SettingsPage() {
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [doors, setDoors] = useState<DockDoor[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editingDoors, setEditingDoors] = useState<DoorEditState[]>([]);
  const [addingDoor, setAddingDoor] = useState(false);
  const [newDoor, setNewDoor] = useState<DoorEditState>({ name: '', door_type: 'inbound', status: 'active', notes: '' });

  const loadData = useCallback(async () => {
    const res = await fetch('/api/facility');
    const data = await res.json();
    if (data.facility) setFacility(data.facility);
    if (data.doors) {
      setDoors(data.doors);
      setEditingDoors(data.doors.map((d: DockDoor) => ({
        id: d.id,
        name: d.name,
        door_type: d.door_type,
        status: d.status,
        notes: d.notes ?? '',
      })));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveFacility = async () => {
    if (!facility) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/facility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facility),
      });
      if (res.ok) {
        setSaveMsg('Saved!');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoor = async (idx: number) => {
    const d = editingDoors[idx];
    if (!d.id) return;
    setEditingDoors((prev) => prev.map((item, i) => i === idx ? { ...item, saving: true } : item));
    await fetch(`/api/dock-doors/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: d.name, door_type: d.door_type, status: d.status, notes: d.notes }),
    });
    setEditingDoors((prev) => prev.map((item, i) => i === idx ? { ...item, saving: false } : item));
  };

  const handleDeactivateDoor = async (idx: number) => {
    const d = editingDoors[idx];
    if (!d.id) return;
    await fetch(`/api/dock-doors/${d.id}`, { method: 'DELETE' });
    setEditingDoors((prev) => prev.map((item, i) => i === idx ? { ...item, status: 'inactive' } : item));
  };

  const handleAddDoor = async () => {
    if (!newDoor.name.trim()) return;
    const res = await fetch('/api/dock-doors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDoor.name, door_type: newDoor.door_type, notes: newDoor.notes }),
    });
    if (res.ok) {
      const data = await res.json();
      setDoors((prev) => [...prev, data.door]);
      setEditingDoors((prev) => [...prev, {
        id: data.door.id,
        name: data.door.name,
        door_type: data.door.door_type,
        status: data.door.status,
        notes: data.door.notes ?? '',
      }]);
      setNewDoor({ name: '', door_type: 'inbound', status: 'active', notes: '' });
      setAddingDoor(false);
    }
  };

  const updateFacility = (key: keyof FacilityData, value: string | number) => {
    setFacility((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const updateDoor = (idx: number, key: keyof DoorEditState, value: string) => {
    setEditingDoors((prev) => prev.map((d, i) => i === idx ? { ...d, [key]: value } : d));
  };

  if (!facility) return <div className="p-6 text-[#8B95A5] text-sm">Loading settings…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Facility configuration and dock door management</p>
      </div>

      {/* Facility Info */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <div className="text-sm font-semibold text-white">Facility Information</div>
        <InputField label="Facility Name">
          <TextInput value={facility.name} onChange={(v) => updateFacility('name', v)} placeholder="Central Distribution Center" />
        </InputField>
        <InputField label="Street Address">
          <TextInput value={facility.address_street} onChange={(v) => updateFacility('address_street', v)} placeholder="4500 Logistics Pkwy" />
        </InputField>
        <div className="grid grid-cols-3 gap-4">
          <InputField label="City">
            <TextInput value={facility.address_city} onChange={(v) => updateFacility('address_city', v)} placeholder="Dallas" />
          </InputField>
          <InputField label="State">
            <TextInput value={facility.address_state} onChange={(v) => updateFacility('address_state', v)} placeholder="TX" />
          </InputField>
          <InputField label="ZIP">
            <TextInput value={facility.address_zip} onChange={(v) => updateFacility('address_zip', v)} placeholder="75201" />
          </InputField>
        </div>
        <InputField label="Timezone">
          <select
            value={facility.timezone}
            onChange={(e) => updateFacility('timezone', e.target.value)}
            className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650]"
          >
            <option value="America/Chicago">Central (CST/CDT)</option>
            <option value="America/New_York">Eastern (EST/EDT)</option>
            <option value="America/Denver">Mountain (MST/MDT)</option>
            <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
          </select>
        </InputField>
        <InputField label="Notes">
          <textarea
            value={facility.notes ?? ''}
            onChange={(e) => updateFacility('notes', e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650] resize-none"
          />
        </InputField>
      </div>

      {/* Operating Hours */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-4">
        <div className="text-sm font-semibold text-white">Operating Hours &amp; Scheduling</div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Operating Hours Start">
            <TextInput type="time" value={facility.operating_hours_start} onChange={(v) => updateFacility('operating_hours_start', v)} />
          </InputField>
          <InputField label="Operating Hours End">
            <TextInput type="time" value={facility.operating_hours_end} onChange={(v) => updateFacility('operating_hours_end', v)} />
          </InputField>
          <InputField label="Buffer Between Appointments (minutes)">
            <TextInput
              type="number"
              value={String(facility.buffer_minutes)}
              onChange={(v) => updateFacility('buffer_minutes', parseInt(v, 10) || 0)}
              placeholder="30"
            />
          </InputField>
        </div>
      </div>

      {/* Save Facility */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveFacility}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#00C650] text-black text-sm font-medium hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saveMsg && <span className="text-sm text-[#00C650]">{saveMsg}</span>}
      </div>

      {/* Dock Door Management */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Dock Doors ({doors.length})</div>
          <button
            onClick={() => setAddingDoor(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#00C650] text-black font-medium hover:bg-[#00C650]/90"
          >
            + Add Door
          </button>
        </div>

        {/* Add door form */}
        {addingDoor && (
          <div className="px-5 py-4 border-b border-[#1A2235] bg-[#0C1528] space-y-3">
            <div className="text-xs text-[#8B95A5] font-medium">New Door</div>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={newDoor.name}
                onChange={(e) => setNewDoor((d) => ({ ...d, name: e.target.value }))}
                placeholder="Door 9"
                className="rounded-lg bg-[#080F1E] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
              />
              <select
                value={newDoor.door_type}
                onChange={(e) => setNewDoor((d) => ({ ...d, door_type: e.target.value as DoorType }))}
                className="rounded-lg bg-[#080F1E] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
              >
                {DOOR_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="text"
                value={newDoor.notes}
                onChange={(e) => setNewDoor((d) => ({ ...d, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="rounded-lg bg-[#080F1E] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddDoor} className="text-xs px-3 py-1.5 rounded-lg bg-[#00C650] text-black font-medium">
                Save
              </button>
              <button onClick={() => setAddingDoor(false)} className="text-xs px-3 py-1.5 rounded-lg bg-[#1A2235] text-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Door list */}
        <div className="divide-y divide-[#1A2235]">
          {editingDoors.map((door, idx) => {
            const statusColor =
              door.status === 'active'
                ? 'text-[#00C650]'
                : door.status === 'maintenance'
                ? 'text-[#FFAA00]'
                : 'text-[#8B95A5]';
            return (
              <div key={door.id ?? idx} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={door.name}
                    onChange={(e) => updateDoor(idx, 'name', e.target.value)}
                    className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
                  />
                  <select
                    value={door.door_type}
                    onChange={(e) => updateDoor(idx, 'door_type', e.target.value)}
                    className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
                  >
                    {DOOR_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={door.status}
                    onChange={(e) => updateDoor(idx, 'status', e.target.value)}
                    className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  <span className={`text-xs font-medium ${statusColor}`}>{door.status}</span>
                  <button
                    onClick={() => handleSaveDoor(idx)}
                    disabled={door.saving}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1A2235] text-white hover:bg-[#2A3448] disabled:opacity-50"
                  >
                    {door.saving ? 'Saving…' : 'Save'}
                  </button>
                  {door.status === 'active' && (
                    <button
                      onClick={() => handleDeactivateDoor(idx)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20 hover:bg-[#FF4444]/20"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
