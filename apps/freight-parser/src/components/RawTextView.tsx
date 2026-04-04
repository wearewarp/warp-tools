'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface RawTextViewProps {
  rawText: string;
  matchedValues: string[];
}

function highlightText(text: string, values: string[]): React.ReactNode[] {
  if (values.length === 0) return [text];

  // Build a regex that matches any of the values (escaped)
  const escaped = values
    .filter((v) => v.length > 2)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return [text];

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <mark key={i} className="bg-[#00C650]/25 text-[#00C650] rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function RawTextView({ rawText, matchedValues }: RawTextViewProps) {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((prev) => !prev);
  }

  const highlighted = open ? highlightText(rawText, matchedValues) : null;

  return (
    <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#8B95A5] hover:text-slate-200 transition-colors"
      >
        <span>Raw Extracted Text</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {open && (
        <div className="border-t border-[#1A2235] px-4 py-3">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-80 overflow-y-auto">
            {highlighted}
          </pre>
        </div>
      )}
    </div>
  );
}
