import { ArrowRight } from 'lucide-react';

interface LaneDisplayProps {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  compact?: boolean;
}

export function LaneDisplay({ originCity, originState, destCity, destState, compact = false }: LaneDisplayProps) {
  if (compact) {
    return (
      <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
        <span className="text-slate-300 font-medium">{originCity}, {originState}</span>
        <ArrowRight className="w-3 h-3 text-[#8B95A5] flex-shrink-0" />
        <span className="text-slate-300 font-medium">{destCity}, {destState}</span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-[#8B95A5]">
      <span className="text-slate-200">{originCity}, {originState}</span>
      <ArrowRight className="w-4 h-4 flex-shrink-0" />
      <span className="text-slate-200">{destCity}, {destState}</span>
    </span>
  );
}
