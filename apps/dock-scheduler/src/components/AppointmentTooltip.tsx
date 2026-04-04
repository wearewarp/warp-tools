import type { Appointment, AppointmentStatus } from '@/db/schema';
import { formatTime, formatDuration, getAppointmentStatusLabel } from '@/lib/utils';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: '#3B82F6',
  checked_in: '#FFAA00',
  in_progress: '#00C650',
  completed: '#8B95A5',
  no_show: '#FF4444',
  cancelled: '#8B95A5',
};

interface AppointmentTooltipProps {
  appointment: Appointment;
  visible: boolean;
}

export function AppointmentTooltip({ appointment: appt, visible }: AppointmentTooltipProps) {
  if (!visible) return null;

  const color = STATUS_COLORS[appt.status as AppointmentStatus] ?? '#8B95A5';

  return (
    <div className="absolute z-50 bottom-full left-0 mb-2 w-56 rounded-lg bg-[#080F1E] border border-[#1A2235] shadow-2xl p-3 pointer-events-none">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-white truncate">
          {appt.carrier_name ?? 'Unknown Carrier'}
        </span>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between gap-2">
          <span className="text-[#8B95A5]">Status</span>
          <span className="font-medium" style={{ color }}>
            {getAppointmentStatusLabel(appt.status as AppointmentStatus)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#8B95A5]">Time</span>
          <span className="text-white">{formatTime(appt.scheduled_time)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[#8B95A5]">Duration</span>
          <span className="text-white">{formatDuration(appt.duration_minutes)}</span>
        </div>
        {appt.load_ref && (
          <div className="flex justify-between gap-2">
            <span className="text-[#8B95A5]">Ref</span>
            <span className="text-white font-mono text-[9px] truncate max-w-[100px]">
              {appt.load_ref}
            </span>
          </div>
        )}
        {appt.driver_name && (
          <div className="flex justify-between gap-2">
            <span className="text-[#8B95A5]">Driver</span>
            <span className="text-white truncate max-w-[120px]">{appt.driver_name}</span>
          </div>
        )}
        {appt.commodity && (
          <div className="flex justify-between gap-2">
            <span className="text-[#8B95A5]">Commodity</span>
            <span className="text-white truncate max-w-[100px]">{appt.commodity}</span>
          </div>
        )}
        {appt.total_dwell_minutes != null && (
          <div className="flex justify-between gap-2">
            <span className="text-[#8B95A5]">Dwell</span>
            <span className="text-[#00C650] font-medium">
              {formatDuration(appt.total_dwell_minutes)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
