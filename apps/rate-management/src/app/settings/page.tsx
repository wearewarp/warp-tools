export const dynamic = 'force-dynamic';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#00C650]" />
          Settings
        </h1>
        <p className="text-[#8B95A5] mt-1 text-sm">Configure your rate management preferences.</p>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">General</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#1A2235]">
            <div>
              <div className="text-sm text-white">Margin Alert Threshold</div>
              <div className="text-xs text-[#8B95A5] mt-0.5">Alert when margin falls below this percentage</div>
            </div>
            <div className="text-sm font-medium text-[#00C650]">10%</div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#1A2235]">
            <div>
              <div className="text-sm text-white">Rate Expiry Warning</div>
              <div className="text-xs text-[#8B95A5] mt-0.5">Warn when rates expire within this many days</div>
            </div>
            <div className="text-sm font-medium text-[#00C650]">30 days</div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm text-white">Default Rate Basis</div>
              <div className="text-xs text-[#8B95A5] mt-0.5">Default basis for new carrier rates</div>
            </div>
            <div className="text-sm font-medium text-[#00C650]">Per Mile</div>
          </div>
        </div>
      </div>

      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2">About</h2>
        <p className="text-sm text-[#8B95A5]">Rate Management v0.1.0 — Part of the <span className="text-[#00C650]">Warp Tools</span> open-source logistics platform.</p>
        <a href="https://github.com/dasokolovsky/warp-tools" className="text-xs text-[#00C650] hover:underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">
          github.com/dasokolovsky/warp-tools
        </a>
      </div>
    </div>
  );
}
