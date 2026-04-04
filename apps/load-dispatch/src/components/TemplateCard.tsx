'use client';

import type { LoadTemplate } from '@/db/schema';
import { formatCurrency } from '@/lib/utils';
import { LaneDisplay } from '@/components/LaneDisplay';
import { EquipmentBadge } from '@/components/EquipmentBadge';
import { Pencil, Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: LoadTemplate;
  onUse: (template: LoadTemplate) => void;
  onEdit: (template: LoadTemplate) => void;
  onDelete: (template: LoadTemplate) => void;
}

export function TemplateCard({ template, onUse, onEdit, onDelete }: TemplateCardProps) {
  function handleUse(e: React.MouseEvent) {
    e.stopPropagation();
    onUse(template);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(template);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(template);
  }

  return (
    <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] p-5 hover:bg-[#0C1528] transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white text-sm flex-1 pr-2">{template.name}</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#8B95A5] bg-[#1A2235] px-2 py-0.5 rounded-full whitespace-nowrap">
            {template.use_count}x used
          </span>
        </div>
      </div>

      {/* Equipment badge */}
      {template.equipment_type && (
        <div className="mb-3">
          <EquipmentBadge type={template.equipment_type} />
        </div>
      )}

      {/* Lane */}
      {template.origin_city && template.dest_city && (
        <div className="mb-2">
          <LaneDisplay
            originCity={template.origin_city}
            originState={template.origin_state ?? ''}
            destCity={template.dest_city}
            destState={template.dest_state ?? ''}
            compact
          />
        </div>
      )}

      {/* Customer */}
      {template.customer_name && (
        <div className="text-xs text-[#8B95A5] mb-1">
          <span className="text-slate-500">Customer:</span> {template.customer_name}
        </div>
      )}

      {/* Rate */}
      {template.customer_rate != null && (
        <div className="text-xs text-[#8B95A5] mb-1">
          <span className="text-slate-500">Rate:</span>{' '}
          <span className="text-[#00C650] font-medium">{formatCurrency(template.customer_rate)}</span>
        </div>
      )}

      {/* Special instructions */}
      {template.special_instructions && (
        <div className="mt-3 p-2.5 rounded-lg bg-[#040810] border border-[#1A2235] text-xs text-[#8B95A5] line-clamp-2">
          {template.special_instructions}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleUse}
          className="flex-1 rounded-lg border border-[#00C650]/30 text-[#00C650] text-xs py-2 hover:bg-[#00C650]/10 transition-colors font-medium"
        >
          Use Template
        </button>
        <button
          onClick={handleEdit}
          className="p-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
          title="Edit template"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-red-400 hover:border-red-400/30 transition-colors"
          title="Delete template"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
