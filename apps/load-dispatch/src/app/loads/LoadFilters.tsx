'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { LoadStatus, EquipmentType } from '@/db/schema';
import { getStatusLabel, getEquipmentLabel } from '@/lib/utils';

const STATUS_OPTIONS: LoadStatus[] = [
  'new', 'posted', 'covered', 'dispatched', 'picked_up', 'in_transit', 'delivered', 'invoiced', 'closed', 'cancelled'
];

const STATUS_COLORS: Record<LoadStatus, string> = {
  new: 'border-slate-400/40 text-slate-300 data-[active=true]:bg-slate-300/20 data-[active=true]:border-slate-300/60',
  posted: 'border-blue-400/40 text-blue-300 data-[active=true]:bg-blue-400/20 data-[active=true]:border-blue-400/60',
  covered: 'border-purple-400/40 text-purple-300 data-[active=true]:bg-purple-400/20 data-[active=true]:border-purple-400/60',
  dispatched: 'border-yellow-400/40 text-yellow-300 data-[active=true]:bg-yellow-400/20 data-[active=true]:border-yellow-400/60',
  picked_up: 'border-orange-400/40 text-orange-300 data-[active=true]:bg-orange-400/20 data-[active=true]:border-orange-400/60',
  in_transit: 'border-cyan-400/40 text-cyan-300 data-[active=true]:bg-cyan-400/20 data-[active=true]:border-cyan-400/60',
  delivered: 'border-green-400/40 text-green-300 data-[active=true]:bg-green-400/20 data-[active=true]:border-green-400/60',
  invoiced: 'border-teal-400/40 text-teal-300 data-[active=true]:bg-teal-400/20 data-[active=true]:border-teal-400/60',
  closed: 'border-slate-500/40 text-slate-400 data-[active=true]:bg-slate-500/20 data-[active=true]:border-slate-500/60',
  cancelled: 'border-red-400/40 text-red-300 data-[active=true]:bg-red-400/20 data-[active=true]:border-red-400/60',
};

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'dry_van', 'reefer', 'flatbed', 'step_deck', 'lowboy', 'tanker', 'intermodal', 'power_only', 'other'
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export function LoadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const toggleStatus = useCallback((status: LoadStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll('status');
    params.delete('status');
    if (current.includes(status)) {
      current.filter((s) => s !== status).forEach((s) => params.append('status', s));
    } else {
      [...current, status].forEach((s) => params.append('status', s));
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    const view = searchParams.get('view');
    if (view) params.set('view', view);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const activeStatuses = searchParams.getAll('status');
  const search = searchParams.get('search') ?? '';
  const equipment = searchParams.get('equipment') ?? '';
  const originState = searchParams.get('origin_state') ?? '';
  const destState = searchParams.get('dest_state') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const hasCarrier = searchParams.get('has_carrier') ?? '';

  const hasActiveFilters = search || activeStatuses.length > 0 || equipment || originState || destState || dateFrom || dateTo || hasCarrier;

  return (
    <div className="space-y-3">
      {/* Search + Clear row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search loads, customers, carriers..."
            defaultValue={search}
            onChange={(e) => updateParam('search', e.target.value || null)}
            className="w-full pl-9 pr-4 py-2 bg-[#080F1E] border border-[#1A2235] rounded-lg text-sm text-white placeholder:text-[#8B95A5] focus:outline-none focus:border-[#00C650]/40"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((status) => {
          const isActive = activeStatuses.includes(status);
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              data-active={isActive}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${STATUS_COLORS[status]}`}
            >
              {getStatusLabel(status)}
            </button>
          );
        })}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2">
        {/* Equipment */}
        <select
          value={equipment}
          onChange={(e) => updateParam('equipment', e.target.value || null)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        >
          <option value="">All Equipment</option>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <option key={eq} value={eq}>{getEquipmentLabel(eq)}</option>
          ))}
        </select>

        {/* Origin state */}
        <select
          value={originState}
          onChange={(e) => updateParam('origin_state', e.target.value || null)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        >
          <option value="">Origin State</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        {/* Dest state */}
        <select
          value={destState}
          onChange={(e) => updateParam('dest_state', e.target.value || null)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        >
          <option value="">Dest State</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => updateParam('date_from', e.target.value || null)}
          placeholder="Pickup from"
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => updateParam('date_to', e.target.value || null)}
          placeholder="Pickup to"
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        />

        {/* Has carrier */}
        <select
          value={hasCarrier}
          onChange={(e) => updateParam('has_carrier', e.target.value || null)}
          className="bg-[#080F1E] border border-[#1A2235] rounded-lg text-xs text-[#8B95A5] px-3 py-2 focus:outline-none focus:border-[#00C650]/40"
        >
          <option value="">Has Carrier: All</option>
          <option value="yes">Has Carrier: Yes</option>
          <option value="no">Has Carrier: No</option>
        </select>
      </div>
    </div>
  );
}
