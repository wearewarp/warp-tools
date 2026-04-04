'use client';

import { useState, useRef, useEffect } from 'react';
import type { Appointment, DockDoor, Facility } from '@/db/schema';
import { DoorLabel } from './DoorLabel';
import { TimeHeader } from './TimeHeader';
import { AppointmentBlock } from './AppointmentBlock';
import { AppointmentDetailModal } from './AppointmentDetailModal';

// Shim to satisfy the existing modal's onUpdate prop (calendar is read-only for now)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  let cur = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (cur < end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    cur += 30;
  }
  return slots;
}

interface CalendarDayViewProps {
  facility: Facility;
  doors: DockDoor[];
  appointments: Appointment[];
  date: string;
  typeFilter: string;
  carrierFilter: string;
  doorFilter: number[];
}

export function CalendarDayView({
  facility,
  doors,
  appointments,
  date,
  typeFilter,
  carrierFilter,
  doorFilter,
}: CalendarDayViewProps) {
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<DockDoor | null>(null);
  const [nowOffset, setNowOffset] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const opStart = facility.operating_hours_start ?? '06:00';
  const opEnd = facility.operating_hours_end ?? '18:00';
  const slots = buildTimeSlots(opStart, opEnd);
  const numSlots = slots.length;
  const startMinutes = timeToMinutes(opStart);
  const endMinutes = timeToMinutes(opEnd);

  // Current time indicator
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  useEffect(() => {
    function updateNow() {
      if (!isToday) {
        setNowOffset(null);
        return;
      }
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (nowMins < startMinutes || nowMins > endMinutes) {
        setNowOffset(null);
        return;
      }
      const fraction = (nowMins - startMinutes) / (endMinutes - startMinutes);
      setNowOffset(fraction);
    }
    updateNow();
    const id = setInterval(updateNow, 60_000);
    return () => clearInterval(id);
  }, [isToday, startMinutes, endMinutes]);

  // Filter doors
  const activeDoors = doors.filter((d) => {
    if (doorFilter.length > 0 && !doorFilter.includes(d.id)) return false;
    return true;
  });
  const numRows = activeDoors.length;

  // Filter appointments
  const filteredAppts = appointments.filter((a) => {
    if (doorFilter.length > 0 && !doorFilter.includes(a.dock_door_id)) return false;
    if (typeFilter && typeFilter !== 'all' && a.appointment_type !== typeFilter) return false;
    if (carrierFilter && !a.carrier_name?.toLowerCase().includes(carrierFilter.toLowerCase())) return false;
    return true;
  });

  const doorRowMap: Record<number, number> = {};
  activeDoors.forEach((d, i) => { doorRowMap[d.id] = i; });

  const LABEL_COL_WIDTH = 120;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[#1A2235] bg-[#040810]">
        <div
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: `${LABEL_COL_WIDTH}px repeat(${numSlots}, minmax(50px, 1fr))`,
            gridTemplateRows: `40px repeat(${numRows}, 60px)`,
            position: 'relative',
            minWidth: `${LABEL_COL_WIDTH + numSlots * 50}px`,
          }}
        >
          {/* Top-left corner */}
          <div
            style={{ gridColumn: 1, gridRow: 1 }}
            className="bg-[#080F1E] border-r border-b border-[#1A2235] flex items-end px-3 pb-1"
          >
            <span className="text-[10px] text-[#8B95A5]">Door</span>
          </div>

          {/* Time header */}
          <TimeHeader slots={slots} />

          {/* Door labels + row backgrounds */}
          {activeDoors.map((door, rowIdx) => (
            <div
              key={door.id}
              style={{
                gridColumn: 1,
                gridRow: rowIdx + 2,
                position: 'relative',
              }}
              className="bg-[#080F1E] border-r border-b border-[#1A2235]"
            >
              <DoorLabel door={door} />
            </div>
          ))}

          {/* Grid cell backgrounds — empty clickable slots */}
          {activeDoors.map((door, rowIdx) =>
            slots.map((slot, slotIdx) => (
              <div
                key={`${door.id}-${slot}`}
                style={{ gridColumn: slotIdx + 2, gridRow: rowIdx + 2 }}
                className="border-r border-b border-[#1A2235] hover:bg-[#0C1528] cursor-pointer transition-colors"
                title={`${door.name} @ ${slot}`}
                onClick={() => {
                  // Emit to parent or console for now — create flow hook
                  console.log('Create appt:', door.id, slot);
                }}
              />
            ))
          )}

          {/* Appointment blocks */}
          {filteredAppts.map((appt) => {
            const rowIdx = doorRowMap[appt.dock_door_id];
            if (rowIdx === undefined) return null;

            const apptStart = timeToMinutes(appt.scheduled_time);
            const colStart = Math.round((apptStart - startMinutes) / 30);
            const colSpan = Math.round(appt.duration_minutes / 30);

            if (colStart < 0 || colStart >= numSlots) return null;

            return (
              <AppointmentBlock
                key={appt.id}
                appointment={appt}
                colStart={colStart}
                colSpan={Math.min(colSpan, numSlots - colStart)}
                rowIndex={rowIdx}
                totalRows={numRows}
                onClick={(appt) => {
                setSelectedAppt(appt);
                setSelectedDoor(doors.find((d) => d.id === appt.dock_door_id) ?? null);
              }}
              />
            );
          })}

          {/* Current time line */}
          {isToday && nowOffset !== null && (
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: `calc(${LABEL_COL_WIDTH}px + ${nowOffset * 100}% * (${numSlots} / ${numSlots + 1}))`,
                width: 2,
                height: numRows * 60,
                background: '#FF4444',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Appointment detail modal */}
      {selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt}
          door={selectedDoor}
          onClose={() => { setSelectedAppt(null); setSelectedDoor(null); }}
          onUpdate={(updated) => setSelectedAppt(updated)}
        />
      )}
    </>
  );
}
