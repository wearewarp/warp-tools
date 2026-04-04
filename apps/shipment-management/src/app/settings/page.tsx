import { SettingsClient } from './SettingsClient';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#8B95A5] text-sm mt-1">Configure your Mini TMS</p>
      </div>
      <SettingsClient />
    </div>
  );
}
