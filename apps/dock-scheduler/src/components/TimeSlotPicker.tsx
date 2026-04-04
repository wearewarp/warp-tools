'use client';

import { formatTime } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  startHour?: number;
  endHour?: number;
  disabled?: boolean;
  className?: string;
}

function generateSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

export function TimeSlotPicker({ value, onChange, startHour = 6, endHour = 20, disabled = false, className = '' }: Props) {
  const slots = generateSlots(startHour, endHour);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00C650] disabled:opacity-50 ${className}`}
    >
      <option value="">Select time…</option>
      {slots.map((slot) => (
        <option key={slot} value={slot}>
          {formatTime(slot)}
        </option>
      ))}
    </select>
  );
}
