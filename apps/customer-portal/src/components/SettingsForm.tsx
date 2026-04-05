'use client';

import { useState } from 'react';
import { showToast } from './Toast';

interface SettingsData {
  companyName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  welcomeMessage: string | null;
  footerText: string | null;
}

interface SettingsFormProps {
  initialData: SettingsData;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName ?? '');
  const [supportEmail, setSupportEmail] = useState(initialData.supportEmail ?? '');
  const [supportPhone, setSupportPhone] = useState(initialData.supportPhone ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(initialData.welcomeMessage ?? '');
  const [footerText, setFooterText] = useState(initialData.footerText ?? '');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName || null,
          supportEmail: supportEmail || null,
          supportPhone: supportPhone || null,
          welcomeMessage: welcomeMessage || null,
          footerText: footerText || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Company Settings */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Company Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#8B95A5] uppercase tracking-wider mb-1 block">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Warp Freight Brokerage"
              className="w-full rounded-md bg-[#040810] border border-[#1A2235] px-3 py-2 text-sm text-slate-200 placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B95A5] uppercase tracking-wider mb-1 block">
              Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@example.com"
              className="w-full rounded-md bg-[#040810] border border-[#1A2235] px-3 py-2 text-sm text-slate-200 placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B95A5] uppercase tracking-wider mb-1 block">
              Support Phone
            </label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-md bg-[#040810] border border-[#1A2235] px-3 py-2 text-sm text-slate-200 placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650]"
            />
          </div>
        </div>
      </div>

      {/* Portal Customization */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Portal Customization</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#8B95A5] uppercase tracking-wider mb-1 block">
              Welcome Message
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome to our shipment portal. Track your shipments, view documents, and communicate with our team."
              rows={3}
              className="w-full rounded-md bg-[#040810] border border-[#1A2235] px-3 py-2 text-sm text-slate-200 placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650] resize-none"
            />
            <p className="text-xs text-[#8B95A5] mt-1">Shown on the portal landing page</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B95A5] uppercase tracking-wider mb-1 block">
              Footer Text
            </label>
            <textarea
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 Your Company. All rights reserved."
              rows={2}
              className="w-full rounded-md bg-[#040810] border border-[#1A2235] px-3 py-2 text-sm text-slate-200 placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650] resize-none"
            />
            <p className="text-xs text-[#8B95A5] mt-1">Shown in the portal footer</p>
          </div>
        </div>
      </div>

      {/* Notifications (placeholder) */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200">Email notifications for new customer messages</p>
            <p className="text-xs text-[#8B95A5] mt-0.5">Email notifications coming soon</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotifications}
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotifications ? 'bg-[#00C650]' : 'bg-[#1A2235]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
