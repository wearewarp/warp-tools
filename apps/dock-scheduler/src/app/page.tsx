'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Appointment, AppointmentStatus, DockDoor, Facility } from '@/db/schema';
import { formatTime, formatDuration, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils';
import { AppointmentDetailModal } from '@/components/AppointmentDetailModal';
import { DockDoorStatusCard } from '@/components/DockDoorStatusCard';
import { DwellTimeDisplay } from '@/components/DwellTimeDisplay';

interface DockStatusEntry {
  door: DockDoor;
  occupant: Appointment | null;
  status: string;
}

interface DwellAvgs {
  today: { avgWait: number | null; avgDock: number | null; avgTotal: number | null };
  week: { avgTotal: number | null };
  month: { avgTotal: number | null };
}

interface SummaryData {
  facility: Facility;
  statusCounts: Record<string, number>;
  dockStatus: DockStatusEntry[];
  dwellAverages: DwellAvgs;
  upcoming: Appointment[];
  lateArrivals: Appointment[];
  doors: DockDoor[];
}

function StatCard({ label, value, sub, accent, warn }: {
  label: string; value: string | number; sub?: string; accent?: string; warn?: boolean;
}) {
  return (
    <div className={`rounded-xl bg-[#080F1E] border p-5 ${warn ? 'border-[#FF4444]/30' : 'border-[#1A2235]'}`}>
      <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color: accent ?? '#ffffff' }}>{value}</div>
      {sub && <div className="text-xs text-[#8B95A5] mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalAppt, setModalAppt] = useState<Appointment | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  // Initial load via lazy initializer pattern: fetch in callback, not synchronously
  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const handleModalUpdate = (updated: Appointment) => {
    setModalAppt(updated);
    fetchSummary();
  };

  if (loading || !data) {
    return (
      <div className="p-6 text-[#8B95A5] text-sm">Loading dashboard…</div>
    );
  }

  const { facility, statusCounts, dockStatus, dwellAverages, upcoming, lateArrivals, doors } = data;
  const sc = statusCounts;
  const total = Object.values(sc).reduce((a, b) => a + b, 0);

  const modalDoor = modalAppt ? doors.find((d) => d.id === modalAppt.dock_door_id) ?? null : null;

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#8B95A5] mt-1">
            {facility?.name ?? 'Facility'} &mdash; {todayLabel}
          </p>
        </div>
        <Link
          href="/appointments/new"
          className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 transition-colors"
        >
          + New Appointment
        </Link>
      </div>

      {/* Late Arrivals Alert */}
      {lateArrivals.length > 0 && (
        <div className="rounded-xl border border-[#FF4444]/30 bg-[#FF4444]/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#FF4444]/20 flex items-center justify-center">
              <span className="text-[#FF4444] text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#FF4444]">
                {lateArrivals.length} Late Arrival{lateArrivals.length !== 1 ? 's' : ''} — No Check-In
              </div>
              <div className="text-xs text-[#8B95A5] mt-0.5">
                Past scheduled time with no check-in recorded
              </div>
              <div className="mt-2 space-y-1">
                {lateArrivals.slice(0, 5).map((a) => {
                  const door = doors.find((d) => d.id === a.dock_door_id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => setModalAppt(a)}
                      className="block text-xs text-slate-300 hover:text-white"
                    >
                      {formatTime(a.scheduled_time)} — {a.carrier_name ?? 'Unknown'} @ {door?.name ?? '—'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checked-in waiting alert */}
      {(sc.checked_in ?? 0) > 0 && (
        <div className="rounded-xl border border-[#FFAA00]/30 bg-[#FFAA00]/5 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#FFAA00]/20 flex items-center justify-center">
            <span className="text-[#FFAA00] text-xs font-bold">!</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#FFAA00]">
              {sc.checked_in} truck{sc.checked_in !== 1 ? 's' : ''} checked in and waiting
            </div>
            <div className="text-xs text-[#8B95A5] mt-0.5">Ready to be assigned to a dock door</div>
          </div>
        </div>
      )}

      {/* Overview Stats Row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={total} sub="today" />
        <StatCard label="Checked In" value={sc.checked_in ?? 0} sub="waiting" accent={(sc.checked_in ?? 0) > 0 ? '#FFAA00' : undefined} />
        <StatCard label="In Progress" value={sc.in_progress ?? 0} sub="at dock" accent={(sc.in_progress ?? 0) > 0 ? '#00C650' : undefined} />
        <StatCard label="Completed" value={sc.completed ?? 0} sub="today" accent="#8B95A5" />
        <StatCard label="No Show" value={sc.no_show ?? 0} sub="today" warn={(sc.no_show ?? 0) > 0} accent={(sc.no_show ?? 0) > 0 ? '#FF4444' : undefined} />
        <StatCard label="Scheduled" value={sc.scheduled ?? 0} sub="upcoming" />
      </div>

      {/* Dwell Time Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Wait Today</div>
          <DwellTimeDisplay minutes={dwellAverages.today.avgWait} />
          <div className="text-xs text-[#8B95A5] mt-1">check-in to dock start</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Dock Today</div>
          <DwellTimeDisplay minutes={dwellAverages.today.avgDock} />
          <div className="text-xs text-[#8B95A5] mt-1">dock start to completion</div>
        </div>
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
          <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-1">Avg Total Today</div>
          <DwellTimeDisplay minutes={dwellAverages.today.avgTotal} />
          <div className="text-xs text-[#8B95A5] mt-1">
            {dwellAverages.week.avgTotal != null
              ? `week avg: ${formatDuration(dwellAverages.week.avgTotal)}`
              : 'no week data'}
          </div>
        </div>
      </div>

      {/* Dock Door Status Grid */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Dock Door Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {dockStatus.map(({ door, occupant }) => (
            <button key={door.id} onClick={() => occupant && setModalAppt(occupant)} className="text-left">
              <DockDoorStatusCard door={door} occupant={occupant} />
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming — next 2 hours */}
      {upcoming.length > 0 && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1A2235] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Upcoming — Next 2 Hours</h2>
            <Link href="/appointments" className="text-xs text-[#00C650] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[#1A2235]">
            {upcoming.map((a) => {
              const door = doors.find((d) => d.id === a.dock_door_id);
              return (
                <button
                  key={a.id}
                  onClick={() => setModalAppt(a)}
                  className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-[#0C1528] transition-colors"
                >
                  <div className="text-sm font-medium text-white w-20 flex-shrink-0">{formatTime(a.scheduled_time)}</div>
                  <div className="font-mono text-[#00C650] text-xs w-16 flex-shrink-0">{door?.name ?? '—'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-300 truncate">{a.carrier_name ?? '—'}</div>
                    <div className="text-xs text-[#8B95A5] truncate">{a.commodity ?? ''}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    a.appointment_type === 'inbound'
                      ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                      : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                  }`}>
                    {a.appointment_type}
                  </span>
                  <div className="text-xs text-[#8B95A5] flex-shrink-0">{formatDuration(a.duration_minutes)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity feed — non-scheduled */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Today&apos;s Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Time</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Commodity</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Dwell</th>
                <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dockStatus
                .filter(({ occupant }) => occupant !== null)
                .map(({ door, occupant }) => {
                  if (!occupant) return null;
                  return (
                    <tr
                      key={occupant.id}
                      className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors cursor-pointer"
                      onClick={() => setModalAppt(occupant)}
                    >
                      <td className="px-5 py-3 font-mono text-[#00C650] text-xs">{door.name}</td>
                      <td className="px-5 py-3 text-slate-300">{formatTime(occupant.scheduled_time)}</td>
                      <td className="px-5 py-3 text-slate-300">{occupant.carrier_name ?? '—'}</td>
                      <td className="px-5 py-3 text-[#8B95A5]">{occupant.commodity ?? '—'}</td>
                      <td className="px-5 py-3">
                        <DwellTimeDisplay minutes={occupant.total_dwell_minutes} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getAppointmentStatusColor(occupant.status as AppointmentStatus)}`}>
                          {getAppointmentStatusLabel(occupant.status as AppointmentStatus)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {dockStatus.every(({ occupant }) => !occupant) && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#8B95A5] text-sm">
                    All doors currently available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {modalAppt && (
        <AppointmentDetailModal
          appointment={modalAppt}
          door={modalDoor ?? null}
          onClose={() => setModalAppt(null)}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
}
