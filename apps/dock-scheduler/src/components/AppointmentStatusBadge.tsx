import { getAppointmentStatusLabel, getAppointmentStatusColor } from '@/lib/utils';
import type { AppointmentStatus } from '@/db/schema';

interface Props {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

export function AppointmentStatusBadge({ status, size = 'sm' }: Props) {
  const base = size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={`${base} rounded-full border font-medium ${getAppointmentStatusColor(status)}`}>
      {getAppointmentStatusLabel(status)}
    </span>
  );
}
