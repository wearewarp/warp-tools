import { db } from '@/db';
import { portalSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SettingsForm } from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

async function getSettings() {
  const rows = await db.select().from(portalSettings).where(eq(portalSettings.id, 'default'));
  if (rows.length > 0) return rows[0];
  return {
    companyName: 'My Brokerage',
    supportEmail: null,
    supportPhone: null,
    welcomeMessage: null,
    footerText: null,
  };
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Configure your portal and company details</p>
      </div>

      <SettingsForm
        initialData={{
          companyName: settings.companyName,
          supportEmail: settings.supportEmail,
          supportPhone: settings.supportPhone,
          welcomeMessage: settings.welcomeMessage,
          footerText: settings.footerText,
        }}
      />
    </div>
  );
}
