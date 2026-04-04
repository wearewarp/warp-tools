export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documentRequirements, documents } from '@/db/schema';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { CompletenessBar } from '@/components/CompletenessBar';
import { getDocTypeLabel } from '@/lib/utils';
import type { DocType } from '@/db/schema';
import { LoadsClientFilters } from '@/components/LoadsClientFilters';

async function getLoadsData() {
  const [allReqs, allDocs] = await Promise.all([
    db.select().from(documentRequirements),
    db.select().from(documents),
  ]);

  // Group requirements by loadRef
  const reqsByLoad: Record<string, typeof allReqs> = {};
  for (const req of allReqs) {
    if (!reqsByLoad[req.loadRef]) reqsByLoad[req.loadRef] = [];
    reqsByLoad[req.loadRef].push(req);
  }

  // Collect all load refs — from reqs and from docs
  const allLoadRefs = new Set([
    ...Object.keys(reqsByLoad),
    ...allDocs.filter((d) => d.loadRef).map((d) => d.loadRef as string),
  ]);

  // Build per-load summary
  const loads = Array.from(allLoadRefs).map((loadRef) => {
    const reqs = reqsByLoad[loadRef] ?? [];
    const loadDocs = allDocs.filter((d) => d.loadRef === loadRef);

    const loadStatus = reqs.length > 0 ? reqs[reqs.length - 1].loadStatus : 'booked';
    const totalRequired = reqs.length;
    const totalFulfilled = reqs.filter((r) => r.fulfilled).length;
    const missingTypes = reqs.filter((r) => !r.fulfilled).map((r) => r.requiredType);

    return {
      loadRef,
      loadStatus,
      totalRequired,
      totalFulfilled,
      missingTypes,
      docCount: loadDocs.length,
    };
  });

  return loads.sort((a, b) => a.loadRef.localeCompare(b.loadRef));
}

const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  booked: 'text-blue-400 bg-blue-400/10',
  in_transit: 'text-yellow-400 bg-yellow-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  invoiced: 'text-purple-400 bg-purple-400/10',
  closed: 'text-slate-400 bg-slate-400/10',
};

export default async function LoadsPage() {
  const loads = await getLoadsData();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Loads</h1>
          <p className="mt-1 text-sm text-[#8B95A5]">
            Document completeness per load
          </p>
        </div>
        <div className="text-sm text-[#8B95A5]">
          {loads.length} load{loads.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Client-side filters wrapper */}
      <LoadsClientFilters loads={loads} statusLabels={STATUS_LABELS} statusColors={STATUS_COLORS} />
    </div>
  );
}
