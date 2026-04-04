import type { DockDoor, DoorType } from '@/db/schema';

function doorTypeBadgeClass(type: DoorType): string {
  switch (type) {
    case 'inbound':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'outbound':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'both':
      return 'text-[#00C650] bg-[#00C650]/10 border-[#00C650]/20';
    default:
      return 'text-[#8B95A5] bg-[#8B95A5]/10 border-[#8B95A5]/20';
  }
}

interface DoorLabelProps {
  door: DockDoor;
}

export function DoorLabel({ door }: DoorLabelProps) {
  const isUnavailable = door.status !== 'active';
  return (
    <div
      className={`flex flex-col justify-center px-3 py-1 h-full ${isUnavailable ? 'opacity-50' : ''}`}
    >
      <div className="text-xs font-semibold text-white truncate leading-tight">{door.name}</div>
      <span
        className={`mt-1 text-[9px] px-1.5 py-0.5 rounded border inline-block w-fit leading-tight ${doorTypeBadgeClass(door.door_type)}`}
      >
        {door.door_type}
      </span>
      {door.status === 'maintenance' && (
        <div className="text-[9px] text-[#FFAA00] mt-0.5 leading-tight">Maint.</div>
      )}
      {door.status === 'inactive' && (
        <div className="text-[9px] text-[#8B95A5] mt-0.5 leading-tight">Inactive</div>
      )}
    </div>
  );
}
