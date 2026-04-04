'use client';

import { useState, useCallback } from 'react';
import type { Appointment, AppointmentStatus, DockDoor } from '@/db/schema';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import { StatusTimeline } from './StatusTimeline';
import { DwellTimeDisplay } from './DwellTimeDisplay';

interface Props {
  appointment: Appointment;
  door: DockDoor | null;
  onClose: () => void;
  onUpdate: (updated: Appointment) => void;
}

export function AppointmentDetailModal({ appointment: initialAppt, door, onClose, onUpdate }: Props) {
  const [appt, setAppt] = useState<Appointment>(initialAppt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [notes, setNotes] = useState(initialAppt.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  const handleAction = useCallback(async (action: string, extra?: Record<string, string>) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/appointments/${appt.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Action failed');
      } else {
        setAppt(data.appointment);
        onUpdate(data.appointment);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [appt.id, onUpdate]);

  const handleCancel = useCallback(async () => {
    if (!cancelReason.trim()) {
      setError('Cancellation reason is required');
      return;
    }
    await handleAction('cancel', { cancellation_reason: cancelReason });
    setShowCancelForm(false);
  }, [cancelReason, handleAction]);

  const handleSaveNotes = useCallback(async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppt(data.appointment);
        onUpdate(data.appointment);
      }
    } catch {
      // ignore
    } finally {
      setSavingNotes(false);
    }
  }, [appt.id, notes, onUpdate]);

  const isTerminal = ['completed', 'cancelled', 'no_show'].includes(appt.status);

  const typeColor =
    appt.appointment_type === 'inbound'
      ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      : 'text-purple-400 bg-purple-400/10 border-purple-400/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1A2235] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{formatDate(appt.scheduled_date)}</span>
              <span className="text-[#8B95A5]">
                {formatTime(appt.scheduled_time)} – {formatTime(appt.end_time ?? undefined)}
              </span>
              {door && <span className="text-xs font-mono text-[#00C650]">{door.name}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <AppointmentStatusBadge status={appt.status as AppointmentStatus} size="md" />
              <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor}`}>
                {appt.appointment_type}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Status Timeline */}
          <div>
            <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Timeline</div>
            <StatusTimeline appointment={appt} />
          </div>

          {/* Dwell Breakdown (if in_progress or completed) */}
          {(appt.status === 'in_progress' || appt.status === 'completed') && (
            <div className="rounded-lg bg-[#0C1528] border border-[#1A2235] p-4">
              <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Dwell Breakdown</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Wait Time</div>
                  <DwellTimeDisplay minutes={appt.wait_minutes} />
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Dock Time</div>
                  <DwellTimeDisplay minutes={appt.dock_minutes} />
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] mb-1">Total Dwell</div>
                  <DwellTimeDisplay minutes={appt.total_dwell_minutes} />
                </div>
              </div>
            </div>
          )}

          {/* Carrier Info */}
          <div className="rounded-lg bg-[#0C1528] border border-[#1A2235] p-4">
            <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Carrier</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[#8B95A5]">Carrier</div>
                <div className="text-white mt-0.5">{appt.carrier_name ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">Driver</div>
                <div className="text-white mt-0.5">{appt.driver_name ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">Truck #</div>
                <div className="text-white mt-0.5 font-mono">{appt.truck_number ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">Trailer #</div>
                <div className="text-white mt-0.5 font-mono">{appt.trailer_number ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">Phone</div>
                <div className="text-white mt-0.5">{appt.driver_phone ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">Duration</div>
                <div className="text-white mt-0.5">{formatDuration(appt.duration_minutes)}</div>
              </div>
            </div>
          </div>

          {/* Load Info */}
          <div className="rounded-lg bg-[#0C1528] border border-[#1A2235] p-4">
            <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-3">Load</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[#8B95A5]">Load Ref</div>
                <div className="text-white mt-0.5 font-mono">{appt.load_ref ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8B95A5]">PO #</div>
                <div className="text-white mt-0.5 font-mono">{appt.po_number ?? '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-[#8B95A5]">Commodity</div>
                <div className="text-white mt-0.5">{appt.commodity ?? '—'}</div>
              </div>
              {appt.special_instructions && (
                <div className="col-span-2">
                  <div className="text-xs text-[#8B95A5]">Special Instructions</div>
                  <div className="text-[#FFAA00] mt-0.5 text-xs">{appt.special_instructions}</div>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation info */}
          {appt.status === 'cancelled' && appt.cancellation_reason && (
            <div className="rounded-lg border border-[#FF4444]/20 bg-[#FF4444]/5 p-3">
              <div className="text-xs text-[#FF4444] font-medium mb-1">Cancellation Reason</div>
              <div className="text-sm text-slate-300">{appt.cancellation_reason}</div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="text-xs text-[#8B95A5] font-medium uppercase tracking-wide mb-2">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650] resize-none"
              placeholder="Add notes…"
            />
            {notes !== (initialAppt.notes ?? '') && (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-[#00C650] text-black font-medium hover:bg-[#00C650]/90 disabled:opacity-50"
              >
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            )}
          </div>

          {/* Cancel form */}
          {showCancelForm && (
            <div className="rounded-lg border border-[#FF4444]/30 bg-[#FF4444]/5 p-4 space-y-3">
              <div className="text-sm font-medium text-[#FF4444]">Cancel Appointment</div>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation…"
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF4444]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-[#FF4444] text-white text-sm font-medium hover:bg-[#FF4444]/90 disabled:opacity-50"
                >
                  Confirm Cancel
                </button>
                <button
                  onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                  className="px-3 py-1.5 rounded-lg bg-[#1A2235] text-white text-sm hover:bg-[#2A3448]"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-[#FF4444] bg-[#FF4444]/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          {!isTerminal && !showCancelForm && (
            <div className="flex flex-wrap gap-2">
              {appt.status === 'scheduled' && (
                <button
                  onClick={() => handleAction('check_in')}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#00C650] text-black text-sm font-medium hover:bg-[#00C650]/90 disabled:opacity-50"
                >
                  Check In
                </button>
              )}
              {appt.status === 'checked_in' && (
                <button
                  onClick={() => handleAction('start')}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#00C650] text-black text-sm font-medium hover:bg-[#00C650]/90 disabled:opacity-50"
                >
                  Start Loading/Unloading
                </button>
              )}
              {appt.status === 'in_progress' && (
                <button
                  onClick={() => handleAction('complete')}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#00C650] text-black text-sm font-medium hover:bg-[#00C650]/90 disabled:opacity-50"
                >
                  Complete
                </button>
              )}
              <button
                onClick={() => handleAction('no_show')}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30 text-sm font-medium hover:bg-[#FF9500]/30 disabled:opacity-50"
              >
                Mark No-Show
              </button>
              <button
                onClick={() => setShowCancelForm(true)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20 text-sm font-medium hover:bg-[#FF4444]/20 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
