import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import type { AppointmentStatus, DockDoor, Appointment } from '@/db/schema';

interface Props {
  door: DockDoor;
  occupant?: Appointment | null;
}

export function DockDoorStatusCard({ door, occupant }: Props) {
  const isAvailable = !occupant;
  const isMaint = door.status === 'maintenance';
  const isInactive = door.status === 'inactive';

  const borderClass = occupant
    ? 'border-[#00C650]/30 bg-[#00C650]/5'
    : isMaint
    ? 'border-[#FFAA00]/20 bg-[#FFAA00]/5'
    : isInactive
    ? 'border-[#1A2235]/50 bg-[#040810] opacity-50'
    : 'border-[#1A2235] bg-[#0C1528]';

  const dotClass = occupant
    ? 'bg-[#00C650]'
    : isMaint
    ? 'bg-[#FFAA00]'
    : isInactive
    ? 'bg-[#1A2235]/50'
    : 'bg-[#2A3448]';

  const typeColors: Record<string, string> = {
    inbound: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    outbound: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    both: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">{door.name}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded border ${typeColors[door.door_type] ?? typeColors.both}`}>
            {door.door_type}
          </span>
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        </div>
      </div>
      {occupant ? (
        <div>
          <div className="text-xs text-white font-medium truncate">{occupant.carrier_name ?? '—'}</div>
          <div className="text-xs text-[#8B95A5] truncate mt-0.5">{occupant.driver_name ?? ''}</div>
          <div className="mt-1.5">
            <AppointmentStatusBadge status={occupant.status as AppointmentStatus} />
          </div>
        </div>
      ) : (
        <div className="text-xs text-[#8B95A5]">
          {isMaint ? 'Under Maintenance' : isInactive ? 'Inactive' : isAvailable ? 'Available' : '—'}
        </div>
      )}
    </div>
  );
}
