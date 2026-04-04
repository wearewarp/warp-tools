'use client';

import type { Confidence } from '@/lib/parser';

interface ConfidenceBadgeProps {
  confidence: Confidence;
}

const BADGE_STYLES: Record<Confidence, string> = {
  high: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  medium: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50',
  low: 'bg-red-900/50 text-red-400 border border-red-700/50',
};

const BADGE_LABELS: Record<Confidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[confidence]}`}
    >
      {BADGE_LABELS[confidence]}
    </span>
  );
}
