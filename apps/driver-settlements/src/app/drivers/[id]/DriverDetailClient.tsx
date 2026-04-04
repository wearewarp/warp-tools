'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Driver, Trip, Advance } from '@/db/schema';
import { formatCurrency, formatDate, cn, getPayTypeColor, getPayTypeLabel, getDriverStatusColor, getDriverStatusLabel } from '@/lib/utils';
import { AddTripModal } from './AddTripModal';
import { AddAdvanceModal } from './AddAdvanceModal';
import { Edit2, UserX, Plus, MapPin, Phone, Mail, CreditCard, Calendar } from 'lucide-react';

type Tab = 'trips' | 'settlements' | 'advances' | 'overview';

interface Stats {
  total_trips: number;
  ytd_earnings: number;
  ytd_trips: number;
  total_miles: number;
  outstanding_advances: number;
}

interface DriverDetailClientProps {
  driver: Driver;
  initialTrips: Trip[];
  initialAdvances: Advance[];
  stats: Stats;
}

function AdvanceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    outstanding: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    deducted: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    forgiven: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', colors[status] ?? colors.outstanding)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function DriverDetailClient({ driver, initialTrips, initialAdvances, stats }: DriverDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('trips');
  const [showTripModal, setShowTripModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(() => initialTrips);
  const [advances, setAdvances] = useState<Advance[]>(() => initialAdvances);
  const [terminating, setTerminating] = useState(false);

  const refreshTrips = useCallback(async () => {
    const res = await fetch(`/api/drivers/${driver.id}/trips`);
    if (res.ok) {
      const data = await res.json();
      setTrips(data);
    }
    setShowTripModal(false);
    router.refresh();
  }, [driver.id, router]);

  const refreshAdvances = useCallback(async () => {
    const res = await fetch(`/api/drivers/${driver.id}/advances`);
    if (res.ok) {
      const data = await res.json();
      setAdvances(data);
    }
    setShowAdvanceModal(false);
    router.refresh();
  }, [driver.id, router]);

  async function handleTerminate() {
    if (!confirm(`Terminate ${driver.first_name} ${driver.last_name}? This will mark the driver as terminated.`)) return;
    setTerminating(true);
    try {
      await fetch(`/api/drivers/${driver.id}`, {
        method: 'DELETE',
      });
      router.push('/drivers');
      router.refresh();
    } finally {
      setTerminating(false);
    }
  }

  const avgPay = trips.length > 0
    ? trips.reduce((s, t) => s + t.pay_amount, 0) / trips.length
    : 0;

  const rateDisplay = (() => {
    switch (driver.pay_type) {
      case 'per_mile': return `$${driver.pay_rate}/mi`;
      case 'percentage': return `${driver.pay_rate}% of revenue`;
      case 'flat': return `$${driver.pay_rate}/load`;
      case 'hourly': return `$${driver.pay_rate}/hr`;
      case 'per_stop': return `$${driver.pay_rate}/stop`;
      default: return String(driver.pay_rate);
    }
  })();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'trips', label: `Trips (${trips.length})` },
    { id: 'settlements', label: 'Settlements' },
    { id: 'advances', label: `Advances (${advances.length})` },
    { id: 'overview', label: 'Overview' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {driver.first_name} {driver.last_name}
              </h1>
              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', getDriverStatusColor(driver.status))}>
                {getDriverStatusLabel(driver.status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B95A5]">
              {driver.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {driver.phone}
                </span>
              )}
              {driver.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {driver.email}
                </span>
              )}
              {driver.address_city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {driver.address_city}, {driver.address_state}
                </span>
              )}
              {driver.hire_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Hired {formatDate(driver.hire_date)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', getPayTypeColor(driver.pay_type))}>
                {getPayTypeLabel(driver.pay_type)}
              </span>
              <span className="text-sm text-white font-medium">{rateDisplay}</span>
              {driver.license_number && (
                <span className="flex items-center gap-1.5 text-xs text-[#8B95A5]">
                  <CreditCard className="w-3.5 h-3.5" />
                  {driver.license_state} {driver.license_number} · Exp {formatDate(driver.license_expiry)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/drivers/${driver.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>
            {driver.status !== 'terminated' && (
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-xs text-red-400 hover:border-red-500/60 hover:text-red-300 transition-colors disabled:opacity-60"
              >
                <UserX className="w-3.5 h-3.5" />
                Terminate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1A2235]">
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-[#00C650] text-[#00C650]'
                  : 'border-transparent text-[#8B95A5] hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Trip History</h2>
            <button
              onClick={() => setShowTripModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00C650] text-black text-xs font-semibold hover:bg-[#00C650]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Trip
            </button>
          </div>
          <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
            {trips.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8B95A5]">No trips yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A2235]">
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Load Ref</th>
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Lane</th>
                      <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium">Miles</th>
                      <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium">Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2235]">
                    {trips.map(trip => (
                      <tr key={trip.id} className="hover:bg-[#0C1528] transition-colors">
                        <td className="px-4 py-3 text-[#8B95A5] text-xs whitespace-nowrap">{formatDate(trip.trip_date)}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-mono text-[#00C650]">{trip.load_ref ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                          {trip.origin_city}, {trip.origin_state} → {trip.dest_city}, {trip.dest_state}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[#8B95A5] tabular-nums">
                          {trip.miles != null ? `${trip.miles.toLocaleString()} mi` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-[#00C650] font-semibold tabular-nums">
                          {formatCurrency(trip.pay_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settlements Tab */}
      {activeTab === 'settlements' && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-12 text-center">
          <p className="text-[#8B95A5] text-sm">Settlement management coming soon.</p>
          <p className="text-[#8B95A5] text-xs mt-1">Use the Settlements tab in the main nav to manage settlements.</p>
        </div>
      )}

      {/* Advances Tab */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Advances</h2>
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00C650] text-black text-xs font-semibold hover:bg-[#00C650]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Advance
            </button>
          </div>
          <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
            {advances.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8B95A5]">No advances on record.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A2235]">
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Date</th>
                      <th className="text-right px-4 py-3 text-xs text-[#8B95A5] font-medium">Amount</th>
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Reason</th>
                      <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2235]">
                    {advances.map(adv => (
                      <tr key={adv.id} className="hover:bg-[#0C1528] transition-colors">
                        <td className="px-4 py-3 text-[#8B95A5] text-xs whitespace-nowrap">{formatDate(adv.date)}</td>
                        <td className="px-4 py-3 text-right text-xs text-yellow-400 font-semibold tabular-nums">
                          {formatCurrency(adv.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">{adv.reason ?? '—'}</td>
                        <td className="px-4 py-3">
                          <AdvanceStatusBadge status={adv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="YTD Earnings" value={formatCurrency(stats.ytd_earnings)} accent />
          <StatCard label="YTD Trips" value={String(stats.ytd_trips)} />
          <StatCard label="Avg Pay / Trip" value={formatCurrency(avgPay)} />
          <StatCard label="Total Miles" value={stats.total_miles > 0 ? `${Math.round(stats.total_miles).toLocaleString()} mi` : '—'} />
          <StatCard label="Outstanding Advances" value={formatCurrency(stats.outstanding_advances)} warn={stats.outstanding_advances > 0} />
          <StatCard label="Total Trips" value={String(stats.total_trips)} />
          <StatCard label="Pay Type" value={getPayTypeLabel(driver.pay_type)} />
          <StatCard label="Pay Rate" value={rateDisplay} />
        </div>
      )}

      {/* Modals */}
      {showTripModal && (
        <AddTripModal
          driverId={driver.id}
          payType={driver.pay_type}
          payRate={driver.pay_rate}
          onClose={() => setShowTripModal(false)}
          onAdded={refreshTrips}
        />
      )}
      {showAdvanceModal && (
        <AddAdvanceModal
          driverId={driver.id}
          onClose={() => setShowAdvanceModal(false)}
          onAdded={refreshAdvances}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 space-y-1">
      <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide">{label}</div>
      <div className={cn('text-2xl font-bold tabular-nums', accent ? 'text-[#00C650]' : warn ? 'text-yellow-400' : 'text-white')}>
        {value}
      </div>
    </div>
  );
}
