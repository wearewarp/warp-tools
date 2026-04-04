'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ExtractedField } from '@/lib/parser';

interface ExtractedFieldCardProps {
  field: ExtractedField;
  onUpdate: (key: string, newValue: string) => void;
}

export function ExtractedFieldCard({ field, onUpdate }: ExtractedFieldCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);

  function handleEditStart() {
    setDraft(field.value);
    setEditing(true);
  }

  function handleSave() {
    onUpdate(field.key, draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(field.value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }

  return (
    <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-4 flex flex-col gap-2 hover:border-[#2A3345] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8B95A5]">
          {field.label}
        </span>
        <ConfidenceBadge confidence={field.confidence} />
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#040810] border border-[#00C650]/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C650]"
          />
          <button
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-[#00C650]/10 text-[#00C650] hover:bg-[#00C650]/20 transition-colors"
            title="Save"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg bg-[#FF4444]/10 text-[#FF4444] hover:bg-[#FF4444]/20 transition-colors"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm text-slate-200 font-mono break-all">{field.value}</span>
          <button
            onClick={handleEditStart}
            className="shrink-0 p-1.5 rounded-lg text-[#8B95A5] hover:text-slate-200 hover:bg-[#1A2235] transition-colors"
            title="Edit value"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}

      <div className="text-xs text-[#8B95A5]/60 truncate" title={field.pattern}>
        Pattern: {field.pattern}
      </div>
    </div>
  );
}
