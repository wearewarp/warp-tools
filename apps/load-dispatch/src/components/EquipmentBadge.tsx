import type { EquipmentType } from '@/db/schema';
import { getEquipmentLabel } from '@/lib/utils';

const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  dry_van: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  reefer: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  flatbed: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  step_deck: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  lowboy: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  tanker: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  intermodal: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  power_only: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  other: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

interface EquipmentBadgeProps {
  type: EquipmentType;
  size?: 'sm' | 'md';
}

export function EquipmentBadge({ type, size = 'sm' }: EquipmentBadgeProps) {
  const colorClass = EQUIPMENT_COLORS[type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span className={`rounded-md border font-medium whitespace-nowrap ${colorClass} ${sizeClass}`}>
      {getEquipmentLabel(type)}
    </span>
  );
}
