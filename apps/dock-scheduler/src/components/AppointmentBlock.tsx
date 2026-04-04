'use client';

import { useState } from 'react';
import type { Appointment, AppointmentStatus } from '@/db/schema';
import { formatTime } from '@/lib/utils';
import { AppointmentTooltip } from './AppointmentTooltip';

const STATUS_BG: Record<AppointmentStatus, string> = {
  scheduled: 'rgba(59,130,246,0.18)',
  checked_in: 'rgba(255,170,0,0.18)',
  in_progress: 'rgba(0,198,80,0.2)',
  completed: 'rgba(139,149,165,0.12)',
  no_show: 'rgba(255,68,68,0.18)',
  cancelled: 'rgba(139,149,165,0.08)',
};
const STATUS_BORDER: Record<AppointmentStatus, string> = {
  scheduled: '#3B82F6',
  checked_in: '#FFAA00',
  in_progress: '#00C650',
  completed: '#8B95A5',
  no_show: '#FF4444',
  cancelled: '#555',
};
const STATUS_TEXT: Record<AppointmentStatus, string> = {
  scheduled: '#93C5FD',
  checked_in: '#FCD34D',
  in_progress: '#4ADE80',
  completed: '#8B95A5',
  no_show: '#FCA5A5',
  cancelled: '#666',
};

interface AppointmentBlockProps {
  appointment: Appointment;
  colStart: number;
  colSpan: number;
  rowIndex: number;
  totalRows: number;
  onClick: (appt: Appointment) => void;
}

export function AppointmentBlock({
  appointment: appt,
  colStart,
  colSpan,
  rowIndex,
  onClick,
}: AppointmentBlockProps) {
  const [hovered, setHovered] = useState(false);
  const status = appt.status as AppointmentStatus;
  const isCancelled = status === 'cancelled';

  return (
    <div
      style={{
        gridColumn: `${colStart + 1} / span ${Math.max(1, colSpan)}`,
        gridRow: rowIndex + 2,
        padding: '2px 1px',
        position: 'relative',
        zIndex: hovered ? 30 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={() => onClick(appt)}
        style={{
          backgroundColor: STATUS_BG[status] ?? 'rgba(139,149,165,0.1)',
          borderLeft: `3px solid ${STATUS_BORDER[status] ?? '#555'}`,
          color: STATUS_TEXT[status] ?? '#8B95A5',
          opacity: isCancelled ? 0.5 : 1,
        }}
        className="h-full w-full rounded overflow-hidden px-1.5 py-1 cursor-pointer hover:brightness-125 transition-all text-[10px] leading-tight"
      >
        <div
          className={`font-semibold truncate ${isCancelled ? 'line-through opacity-60' : ''}`}
        >
          {appt.carrier_name ?? 'Unknown'}
        </div>
        {colSpan >= 2 && (
          <div className="opacity-70 truncate">
            {formatTime(appt.scheduled_time)}
            {appt.end_time ? ` – ${formatTime(appt.end_time)}` : ''}
          </div>
        )}
      </div>

      <AppointmentTooltip appointment={appt} visible={hovered} />
    </div>
  );
}
