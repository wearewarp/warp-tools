interface TimeHeaderProps {
  slots: string[]; // e.g. ['06:00', '06:30', '07:00', ...]
}

export function TimeHeader({ slots }: TimeHeaderProps) {
  return (
    <>
      {slots.map((time, i) => {
        const [h, m] = time.split(':').map(Number);
        const isHour = m === 0;
        const label = isHour ? `${h}:00` : '';
        return (
          <div
            key={time}
            style={{ gridColumn: i + 2, gridRow: 1 }}
            className={`flex items-center justify-start pl-1 text-[10px] border-r border-b border-[#1A2235] select-none ${
              isHour ? 'text-[#8B95A5] font-medium' : 'text-transparent'
            }`}
          >
            {label}
          </div>
        );
      })}
    </>
  );
}
