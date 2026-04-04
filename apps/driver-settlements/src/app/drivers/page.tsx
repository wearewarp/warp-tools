export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { drivers } from '@/db/schema';
import { formatDate, getPayTypeLabel, getPayTypeColor, getDriverStatusLabel, getDriverStatusColor, cn } from '@/lib/utils';
import { Users, Plus } from 'lucide-react';

export default async function DriversPage() {
  const allDrivers = await db.select().from(drivers).orderBy(drivers.last_name);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{allDrivers.length} drivers in the system</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Driver
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {allDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-10 w-10 text-[#1A2235]" />
            <p className="text-sm text-[#8B95A5]">No drivers yet. Add your first driver to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Pay Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Hired</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">License Exp.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8B95A5] uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {allDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-[#0C1528] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white text-sm">
                        {driver.first_name} {driver.last_name}
                      </div>
                      <div className="text-xs text-[#8B95A5]">
                        {driver.address_city && driver.address_state
                          ? `${driver.address_city}, ${driver.address_state}`
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-300">{driver.phone ?? '—'}</div>
                      <div className="text-xs text-[#8B95A5]">{driver.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        getPayTypeColor(driver.pay_type)
                      )}>
                        {getPayTypeLabel(driver.pay_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 tabular-nums">
                      {driver.pay_type === 'per_mile' && `$${driver.pay_rate}/mi`}
                      {driver.pay_type === 'percentage' && `${driver.pay_rate}%`}
                      {driver.pay_type === 'flat' && `$${driver.pay_rate}/load`}
                      {driver.pay_type === 'hourly' && `$${driver.pay_rate}/hr`}
                      {driver.pay_type === 'per_stop' && `$${driver.pay_rate}/stop`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(driver.hire_date)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(driver.license_expiry)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        getDriverStatusColor(driver.status)
                      )}>
                        {getDriverStatusLabel(driver.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
