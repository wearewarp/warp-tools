'use client';

import { useState } from 'react';

interface Settings {
  shipmentPrefix: string;
  defaultEquipment: string;
  targetMarginPct: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  requiredDocs: {
    booked: string[];
    dispatched: string[];
    delivered: string[];
    invoiced: string[];
  };
}

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

const DOC_OPTIONS = ['bol', 'pod', 'rate_con', 'invoice'];
const DOC_LABELS: Record<string, string> = {
  bol: 'BOL',
  pod: 'POD',
  rate_con: 'Rate Confirmation',
  invoice: 'Invoice',
};

const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
};

function getDefaultSettings(): Settings {
  if (typeof window === 'undefined') {
    return {
      shipmentPrefix: 'SHP',
      defaultEquipment: 'dry_van',
      targetMarginPct: '20',
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      requiredDocs: {
        booked: ['rate_con'],
        dispatched: ['bol', 'rate_con'],
        delivered: ['bol', 'pod', 'rate_con'],
        invoiced: ['bol', 'pod', 'rate_con', 'invoice'],
      },
    };
  }
  try {
    const saved = localStorage.getItem('tms-settings');
    if (saved) return JSON.parse(saved) as Settings;
  } catch {
    // ignore
  }
  return {
    shipmentPrefix: 'SHP',
    defaultEquipment: 'dry_van',
    targetMarginPct: '20',
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    requiredDocs: {
      booked: ['rate_con'],
      dispatched: ['bol', 'rate_con'],
      delivered: ['bol', 'pod', 'rate_con'],
      invoiced: ['bol', 'pod', 'rate_con', 'invoice'],
    },
  };
}

const inputClass =
  'w-full bg-[#0C1528] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/50';

export function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(getDefaultSettings);
  const [saved, setSaved] = useState(false);

  function update(field: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleDoc(status: keyof Settings['requiredDocs'], doc: string) {
    setSettings((prev) => {
      const current = prev.requiredDocs[status];
      const updated = current.includes(doc)
        ? current.filter((d) => d !== doc)
        : [...current, doc];
      return { ...prev, requiredDocs: { ...prev.requiredDocs, [status]: updated } };
    });
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem('tms-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* General */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">General</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Shipment Number Prefix</label>
            <input
              type="text"
              className={inputClass}
              value={settings.shipmentPrefix}
              onChange={(e) => update('shipmentPrefix', e.target.value)}
              placeholder="SHP"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Default Equipment Type</label>
            <select
              className={inputClass}
              value={settings.defaultEquipment}
              onChange={(e) => update('defaultEquipment', e.target.value)}
            >
              {EQUIPMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Target Margin %</label>
            <input
              type="number"
              className={inputClass}
              value={settings.targetMarginPct}
              onChange={(e) => update('targetMarginPct', e.target.value)}
              placeholder="20"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Company Info</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-[#8B95A5] mb-1">Company Name</label>
            <input
              type="text"
              className={inputClass}
              value={settings.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              placeholder="Acme Freight Brokers LLC"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Email</label>
              <input
                type="email"
                className={inputClass}
                value={settings.companyEmail}
                onChange={(e) => update('companyEmail', e.target.value)}
                placeholder="ops@company.com"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Phone</label>
              <input
                type="tel"
                className={inputClass}
                value={settings.companyPhone}
                onChange={(e) => update('companyPhone', e.target.value)}
                placeholder="555-555-5555"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Required Docs */}
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Required Documents per Status</h2>
        <p className="text-xs text-[#8B95A5]">Configure which documents are required at each status for compliance scoring.</p>
        <div className="space-y-4">
          {(Object.keys(STATUS_LABELS) as (keyof Settings['requiredDocs'])[]).map((status) => (
            <div key={status}>
              <div className="text-xs font-medium text-white mb-2">{STATUS_LABELS[status]}</div>
              <div className="flex flex-wrap gap-3">
                {DOC_OPTIONS.map((doc) => {
                  const checked = settings.requiredDocs[status].includes(doc);
                  return (
                    <label key={doc} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDoc(status, doc)}
                        className="accent-[#00C650]"
                      />
                      <span className="text-sm text-[#8B95A5]">{DOC_LABELS[doc]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 text-sm font-medium rounded-lg bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
        >
          Save Settings
        </button>
        {saved && (
          <span className="text-sm text-green-400">✓ Saved to localStorage</span>
        )}
      </div>
    </div>
  );
}
