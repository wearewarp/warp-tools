export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { deductionTemplates } from '@/db/schema';
import { formatCurrency, cn } from '@/lib/utils';
import { Settings, Plus, Check } from 'lucide-react';

export default async function SettingsPage() {
  const templates = await db.select().from(deductionTemplates).orderBy(deductionTemplates.id);

  const CATEGORY_LABELS: Record<string, string> = {
    insurance: 'Insurance',
    lease: 'Lease',
    eld: 'ELD',
    fuel_advance: 'Fuel Advance',
    toll: 'Toll',
    ticket: 'Ticket',
    repair: 'Repair',
    other: 'Other',
  };

  const FREQ_LABELS: Record<string, string> = {
    per_settlement: 'Per Settlement',
    monthly: 'Monthly',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Manage deduction templates and system configuration</p>
      </div>

      {/* Deduction Templates */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#8B95A5]" />
            <h2 className="text-sm font-semibold text-white">Deduction Templates</h2>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors">
            <Plus className="h-3 w-3" />
            Add Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">
            No deduction templates yet.
          </div>
        ) : (
          <div className="divide-y divide-[#1A2235]">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#0C1528] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    t.active ? 'bg-[#00C650]' : 'bg-[#8B95A5]'
                  )} />
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-[#8B95A5]">
                      {CATEGORY_LABELS[t.category] ?? t.category} &middot; {FREQ_LABELS[t.frequency] ?? t.frequency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {t.is_percentage ? `${t.amount}%` : formatCurrency(t.amount)}
                  </span>
                  {t.active && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#00C650]">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
