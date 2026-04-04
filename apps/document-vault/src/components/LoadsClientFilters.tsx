'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { CompletenessBar } from './CompletenessBar';
import { getDocTypeLabel } from '@/lib/utils';
import type { DocType } from '@/db/schema';

interface LoadSummary {
  loadRef: string;
  loadStatus: string;
  totalRequired: number;
  totalFulfilled: number;
  missingTypes: string[];
  docCount: number;
}

interface Props {
  loads: LoadSummary[];
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
}

export function LoadsClientFilters({ loads, statusLabels, statusColors }: Props) {
  const [missingOnly, setMissingOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'loadRef' | 'missing' | 'status'>('loadRef');

  const filtered = useMemo(() => {
    let result = [...loads];
    if (missingOnly) result = result.filter((l) => l.missingTypes.length > 0);
    if (statusFilter !== 'all') result = result.filter((l) => l.loadStatus === statusFilter);
    if (sortBy === 'loadRef') result.sort((a, b) => a.loadRef.localeCompare(b.loadRef));
    else if (sortBy === 'missing') result.sort((a, b) => b.missingTypes.length - a.missingTypes.length);
    else if (sortBy === 'status') result.sort((a, b) => a.loadStatus.localeCompare(b.loadStatus));
    return result;
  }, [loads, missingOnly, statusFilter, sortBy]);

  const statuses = Array.from(new Set(loads.map((l) => l.loadStatus)));

  return (
    <>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-[#4B6080]" />
          <span className="text-xs text-[#8B95A5]">Filters:</span>
        </div>

        {/* Missing only toggle */}
        <button
          onClick={() => setMissingOnly(!missingOnly)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            missingOnly
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-[#1A2235] bg-[#080F1E] text-[#8B95A5] hover:text-white'
          }`}
        >
          <AlertCircle className="h-3 w-3" />
          Missing Only
        </button>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#1A2235] bg-[#080F1E] text-[#8B95A5] focus:outline-none focus:border-[#4B8EE8] focus:text-white"
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabels[s] ?? s}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'loadRef' | 'missing' | 'status')}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#1A2235] bg-[#080F1E] text-[#8B95A5] focus:outline-none focus:border-[#4B8EE8] focus:text-white"
        >
          <option value="loadRef">Sort: Load Ref</option>
          <option value="missing">Sort: Most Missing</option>
          <option value="status">Sort: Status</option>
        </select>

        <span className="text-xs text-[#4B6080] ml-auto">
          {filtered.length} of {loads.length} loads
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-[#00C650] mx-auto mb-3" />
          <p className="text-white font-medium mb-1">All loads complete!</p>
          <p className="text-sm text-[#8B95A5]">No loads match the current filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1A2235] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#0C1528] border-b border-[#1A2235]">
            <div className="col-span-2 text-xs font-medium text-[#4B6080] uppercase tracking-wide">Load Ref</div>
            <div className="col-span-2 text-xs font-medium text-[#4B6080] uppercase tracking-wide">Status</div>
            <div className="col-span-2 text-xs font-medium text-[#4B6080] uppercase tracking-wide">Docs</div>
            <div className="col-span-3 text-xs font-medium text-[#4B6080] uppercase tracking-wide">Missing</div>
            <div className="col-span-3 text-xs font-medium text-[#4B6080] uppercase tracking-wide">Completeness</div>
          </div>

          {/* Rows */}
          {filtered.map((load) => {
            const pct = load.totalRequired === 0 ? 100 : Math.round((load.totalFulfilled / load.totalRequired) * 100);
            const isComplete = load.missingTypes.length === 0;
            return (
              <Link
                key={load.loadRef}
                href={`/loads/${encodeURIComponent(load.loadRef)}`}
                className="group grid grid-cols-12 gap-3 px-4 py-3.5 border-b border-[#1A2235] last:border-0 bg-[#080F1E] hover:bg-[#0C1528] transition-colors items-center"
              >
                {/* Load Ref */}
                <div className="col-span-2 font-mono text-sm text-[#4B8EE8] group-hover:text-blue-300 transition-colors">
                  {load.loadRef}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[load.loadStatus] ?? 'text-slate-400 bg-slate-400/10'}`}>
                    {statusLabels[load.loadStatus] ?? load.loadStatus}
                  </span>
                </div>

                {/* Doc count */}
                <div className="col-span-2 text-sm text-[#8B95A5]">
                  {load.docCount} file{load.docCount !== 1 ? 's' : ''}
                </div>

                {/* Missing */}
                <div className="col-span-3">
                  {isComplete ? (
                    <div className="flex items-center gap-1 text-xs text-[#00C650]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {load.missingTypes.slice(0, 2).map((t) => (
                        <span key={t} className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                          {getDocTypeLabel(t as DocType).split(' ').map(w => w[0]).join('')}
                        </span>
                      ))}
                      {load.missingTypes.length > 2 && (
                        <span className="text-xs text-[#8B95A5]">+{load.missingTypes.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Completeness bar */}
                <div className="col-span-3">
                  <CompletenessBar
                    fulfilled={load.totalFulfilled}
                    total={load.totalRequired}
                    showLabel
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
