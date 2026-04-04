'use client';

import { FlaskConical } from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '@/lib/samples';

interface SampleSelectorProps {
  onSelect: (text: string) => void;
}

export function SampleSelector({ onSelect }: SampleSelectorProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === id);
    if (sample) {
      onSelect(sample.text);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <FlaskConical size={14} className="text-[#8B95A5] shrink-0" />
      <label htmlFor="sample-select" className="text-xs text-[#8B95A5] whitespace-nowrap">
        Try a sample:
      </label>
      <select
        id="sample-select"
        onChange={handleChange}
        defaultValue=""
        className="flex-1 bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C650] cursor-pointer hover:border-[#2A3345] transition-colors"
      >
        <option value="" disabled>
          Select a sample document…
        </option>
        {SAMPLE_DOCUMENTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
