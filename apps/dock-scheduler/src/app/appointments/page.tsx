'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Appointment, AppointmentStatus, DockDoor } from '@/db/schema';
import { formatDate, formatTime, formatDuration, getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils';
import { AppointmentDetailModal } from '@/components/AppointmentDetailModal';
import { DwellTimeDisplay } from '@/components/DwellTimeDisplay';

interface ApiResponse {
  appointments: Appointment[];
  doors: DockDoor[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUSES: AppointmentStatus[] = ['scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'];

export default function AppointmentsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doorId, setDoorId] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('scheduled_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [modalAppt, setModalAppt] = useState<Appointment | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (p: number = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        sortBy,
        sortDir,
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(doorId && { doorId }),
        ...(status && { status }),
        ...(type && { type }),
      });
      const res = await fetch(`/api/appointments?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, search, dateFrom, dateTo, doorId, status, type]);

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 300);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search, dateFrom, dateTo, doorId, status, type, sortBy, sortDir, fetchData]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const scheduledIds = (data?.appointments ?? [])
      .filter((a) => a.status === 'scheduled')
      .map((a) => a.id);
    const allSelected = scheduledIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        scheduledIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        scheduledIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkCheckin = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await fetch('/api/appointments/bulk-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      fetchData(page);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleModalUpdate = (updated: Appointment) => {
    setModalAppt(updated);
    if (data) {
      setData({
        ...data,
        appointments: data.appointments.map((a) => (a.id === updated.id ? updated : a)),
      });
    }
  };

  const doors = data?.doors ?? [];
  const appts = data?.appointments ?? [];
  const scheduledOnPage = appts.filter((a) => a.status === 'scheduled');
  const allScheduledSelected = scheduledOnPage.length > 0 && scheduledOnPage.every((a) => selected.has(a.id));

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return <span className="ml-1 text-[#2A3448]">↕</span>;
    return <span className="ml-1 text-[#00C650]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function renderSortHeader(col: string, label: string) {
    return (
      <th
        className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium cursor-pointer hover:text-white select-none"
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon col={col} />
      </th>
    );
  }

  const modalDoor = modalAppt ? doors.find((d) => d.id === modalAppt.dock_door_id) ?? null : null;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-sm text-[#8B95A5] mt-1">
            {data ? `${data.total} total` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={handleBulkCheckin}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-lg bg-[#FFAA00] text-black text-sm font-medium hover:bg-[#FFAA00]/90 disabled:opacity-50"
            >
              {bulkLoading ? 'Checking In…' : `Check In ${selected.size} Selected`}
            </button>
          )}
          <Link
            href="/appointments/new"
            className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 transition-colors"
          >
            + New Appointment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search carrier, load ref, PO#, truck…"
            className="flex-1 min-w-48 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={doorId}
            onChange={(e) => setDoorId(e.target.value)}
            className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          >
            <option value="">All Doors</option>
            {doors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{getAppointmentStatusLabel(s)}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#00C650]"
          >
            <option value="">All Types</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          {(search || dateFrom || dateTo || doorId || status || type) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setDoorId(''); setStatus(''); setType(''); }}
              className="text-xs text-[#8B95A5] hover:text-white px-2 py-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {loading && (
          <div className="px-5 py-4 text-sm text-[#8B95A5]">Loading…</div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allScheduledSelected}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {renderSortHeader('scheduled_date', 'Date / Time')}
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                  {renderSortHeader('carrier_name', 'Carrier')}
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Driver</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Truck #</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Load Ref</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Dwell</th>
                  {renderSortHeader('status', 'Status')}
                </tr>
              </thead>
              <tbody>
                {appts.map((appt) => {
                  const door = doors.find((d) => d.id === appt.dock_door_id);
                  const isScheduled = appt.status === 'scheduled';
                  const isChecked = selected.has(appt.id);
                  return (
                    <tr
                      key={appt.id}
                      className={`border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors cursor-pointer ${isChecked ? 'bg-[#00C650]/5' : ''}`}
                      onClick={() => setModalAppt(appt)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {isScheduled && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(appt.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300 text-xs">{formatDate(appt.scheduled_date)}</div>
                        <div className="text-xs text-[#8B95A5] mt-0.5">
                          {formatTime(appt.scheduled_time)} — {formatTime(appt.end_time ?? undefined)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#00C650] text-xs">{door?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{appt.carrier_name ?? '—'}</td>
                      <td className="px-4 py-3 text-[#8B95A5] text-xs">{appt.driver_name ?? '—'}</td>
                      <td className="px-4 py-3 text-[#8B95A5] font-mono text-xs">{appt.truck_number ?? '—'}</td>
                      <td className="px-4 py-3 text-[#8B95A5] font-mono text-xs">{appt.load_ref ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          appt.appointment_type === 'inbound'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                        }`}>
                          {appt.appointment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {appt.total_dwell_minutes != null ? (
                          <DwellTimeDisplay minutes={appt.total_dwell_minutes} />
                        ) : appt.status === 'in_progress' && appt.checked_in_at ? (
                          <span className="text-xs text-[#8B95A5]">In progress</span>
                        ) : (
                          <span className="text-[#8B95A5]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getAppointmentStatusColor(appt.status as AppointmentStatus)}`}>
                          {getAppointmentStatusLabel(appt.status as AppointmentStatus)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {appts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-[#8B95A5] text-sm">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-[#1A2235] flex items-center justify-between">
            <div className="text-xs text-[#8B95A5]">
              Page {data.page} of {data.totalPages} — {data.total} total
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setPage((p) => p - 1); fetchData(page - 1); }}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white disabled:opacity-40 hover:border-[#00C650] transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => { setPage((p) => p + 1); fetchData(page + 1); }}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white disabled:opacity-40 hover:border-[#00C650] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
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
