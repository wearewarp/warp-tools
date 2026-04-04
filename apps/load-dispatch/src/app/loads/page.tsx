export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/db';
import { loads, checkCalls } from '@/db/schema';
import { desc, asc, like, or, and, inArray, isNotNull, isNull, gte, lte, sql } from 'drizzle-orm';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getUrgencyLevel } from '@/lib/utils';
import { LaneDisplay } from '@/components/LaneDisplay';
import { EquipmentBadge } from '@/components/EquipmentBadge';
import { KanbanBoard } from './KanbanBoard';
import { LoadFilters } from './LoadFilters';
import type { LoadStatus, EquipmentType } from '@/db/schema';
import type { Load } from '@/db/schema';
import { LayoutGrid, Table2, Clock, ChevronUp, ChevronDown } from 'lucide-react';

type LoadWithCheckCall = Load & { lastCheckCallAt?: string | null };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}

function getParamArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

async function fetchLoads(params: Record<string, string | string[] | undefined>) {
  const search = getParam(params.search);
  const statuses = getParamArray(params.status);
  const equipment = getParam(params.equipment);
  const originState = getParam(params.origin_state);
  const destState = getParam(params.dest_state);
  const dateFrom = getParam(params.date_from);
  const dateTo = getParam(params.date_to);
  const hasCarrier = getParam(params.has_carrier);
  const sortBy = getParam(params.sort, 'created_at');
  const sortDir = getParam(params.dir, 'desc');
  const page = parseInt(getParam(params.page, '1'), 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(loads.load_number, `%${search}%`),
        like(loads.customer_name, `%${search}%`),
        like(loads.carrier_name, `%${search}%`),
        like(loads.origin_city, `%${search}%`),
        like(loads.dest_city, `%${search}%`),
      )
    );
  }

  if (statuses.length > 0) {
    conditions.push(sql`${loads.status} IN (${sql.join(statuses.map(s => sql`${s}`), sql`, `)})`);
  }

  if (equipment) {
    conditions.push(sql`${loads.equipment_type} = ${equipment}`);
  }

  if (originState) {
    conditions.push(sql`${loads.origin_state} = ${originState}`);
  }

  if (destState) {
    conditions.push(sql`${loads.dest_state} = ${destState}`);
  }

  if (dateFrom) {
    conditions.push(gte(loads.pickup_date, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(loads.pickup_date, dateTo));
  }

  if (hasCarrier === 'yes') {
    conditions.push(isNotNull(loads.carrier_name));
  } else if (hasCarrier === 'no') {
    conditions.push(isNull(loads.carrier_name));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = (() => {
    switch (sortBy) {
      case 'load_number': return loads.load_number;
      case 'customer_name': return loads.customer_name;
      case 'origin_city': return loads.origin_city;
      case 'dest_city': return loads.dest_city;
      case 'pickup_date': return loads.pickup_date;
      case 'delivery_date': return loads.delivery_date;
      case 'carrier_name': return loads.carrier_name;
      case 'customer_rate': return loads.customer_rate;
      case 'carrier_rate': return loads.carrier_rate;
      case 'margin': return loads.margin;
      case 'status': return loads.status;
      default: return loads.created_at;
    }
  })();

  const orderFn = sortDir === 'asc' ? asc : desc;

  const [allLoads, countResult] = await Promise.all([
    db.select().from(loads).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(loads).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return { allLoads, total, page, limit, pages: Math.ceil(total / limit), sortBy, sortDir };
}

async function fetchAllLoadsForKanban() {
  // For kanban: get all (no pagination), join with latest check call time
  const allLoads = await db.select().from(loads).orderBy(desc(loads.created_at));

  // Get latest check call per load
  const latestCalls = await db
    .select({
      load_id: checkCalls.load_id,
      last_at: sql<string>`max(${checkCalls.created_at})`,
    })
    .from(checkCalls)
    .groupBy(checkCalls.load_id);

  const callMap = new Map(latestCalls.map((c) => [c.load_id, c.last_at]));

  return allLoads.map((l) => ({
    ...l,
    lastCheckCallAt: callMap.get(l.id) ?? null,
  }));
}

interface SortHeaderProps {
  col: string;
  label: string;
  currentSort: string;
  currentDir: string;
  searchParamsStr: string;
}

function SortHeader({ col, label, currentSort, currentDir, searchParamsStr }: SortHeaderProps) {
  const isActive = currentSort === col;
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc';
  const params = new URLSearchParams(searchParamsStr);
  params.set('sort', col);
  params.set('dir', nextDir);
  params.delete('page');

  return (
    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium whitespace-nowrap">
      <Link
        href={`?${params.toString()}`}
        className="flex items-center gap-1 hover:text-white transition-colors"
      >
        {label}
        {isActive ? (
          currentDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-30" />
        )}
      </Link>
    </th>
  );
}

export default async function LoadBoardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = getParam(params.view, 'table');
  const isKanban = view === 'kanban';

  const [tableData, kanbanLoads] = await Promise.all([
    !isKanban ? fetchLoads(params) : Promise.resolve(null),
    isKanban ? fetchAllLoadsForKanban() : Promise.resolve([] as LoadWithCheckCall[]),
  ]);

  // Build search params string for links (preserving current filters)
  const currentParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      v.forEach((val) => currentParams.append(k, val));
    } else if (v) {
      currentParams.set(k, v);
    }
  }
  const paramsStr = currentParams.toString();

  // Toggle view link
  const viewToggleParams = new URLSearchParams(paramsStr);
  viewToggleParams.set('view', isKanban ? 'table' : 'kanban');
  viewToggleParams.delete('page');
  const viewToggleHref = `?${viewToggleParams.toString()}`;

  const total = tableData?.total ?? kanbanLoads.length;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Board</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{total} loads</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <Link
            href={viewToggleHref}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1A2235] text-xs text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
          >
            {isKanban ? (
              <><Table2 className="w-4 h-4" /> Table</>
            ) : (
              <><LayoutGrid className="w-4 h-4" /> Kanban</>
            )}
          </Link>

          <Link
            href="/loads/new"
            className="rounded-lg bg-[#00C650] text-black px-4 py-2 text-sm font-semibold hover:bg-[#00C650]/90 transition-colors"
          >
            + New Load
          </Link>
        </div>
      </div>

      {/* Filters */}
      <LoadFilters />

      {/* Kanban view */}
      {isKanban && (
        <KanbanBoard loads={kanbanLoads} />
      )}

      {/* Table view */}
      {!isKanban && tableData && (
        <>
          <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A2235]">
                    <SortHeader col="load_number" label="Load #" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="status" label="Status" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="customer_name" label="Customer" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Lane</th>
                    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Equipment</th>
                    <SortHeader col="pickup_date" label="Pickup" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="delivery_date" label="Delivery" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="carrier_name" label="Carrier" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="customer_rate" label="Cust. Rate" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="carrier_rate" label="Carrier Rate" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                    <SortHeader col="margin" label="Margin" currentSort={tableData.sortBy} currentDir={tableData.sortDir} searchParamsStr={paramsStr} />
                  </tr>
                </thead>
                <tbody>
                  {tableData.allLoads.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-5 py-12 text-center text-[#8B95A5] text-sm">
                        No loads found
                      </td>
                    </tr>
                  ) : (
                    tableData.allLoads.map((load) => {
                      const urgency = getUrgencyLevel(load.pickup_date);
                      const urgencyBorder = urgency === 'urgent' ? 'border-l-red-500' : urgency === 'soon' ? 'border-l-yellow-400' : 'border-l-transparent';
                      return (
                        <tr
                          key={load.id}
                          className={`border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528] transition-colors border-l-2 ${urgencyBorder}`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Link href={`/loads/${load.id}`} className="font-mono text-[#00C650] text-xs font-semibold hover:underline">
                              {load.load_number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(load.status as LoadStatus)}`}>
                              {getStatusLabel(load.status as LoadStatus)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{load.customer_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <LaneDisplay
                              originCity={load.origin_city}
                              originState={load.origin_state}
                              destCity={load.dest_city}
                              destState={load.dest_state}
                              compact
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <EquipmentBadge type={load.equipment_type as EquipmentType} />
                          </td>
                          <td className="px-4 py-3 text-[#8B95A5] whitespace-nowrap text-xs">{formatDate(load.pickup_date)}</td>
                          <td className="px-4 py-3 text-[#8B95A5] whitespace-nowrap text-xs">{formatDate(load.delivery_date)}</td>
                          <td className="px-4 py-3 text-[#8B95A5] whitespace-nowrap text-xs">
                            {load.carrier_name ?? <span className="opacity-40 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{formatCurrency(load.customer_rate)}</td>
                          <td className="px-4 py-3 text-[#8B95A5] whitespace-nowrap text-xs">{formatCurrency(load.carrier_rate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            {load.margin != null ? (
                              <span className="text-[#00C650]">{formatCurrency(load.margin)}</span>
                            ) : (
                              <span className="text-[#8B95A5] opacity-40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {tableData.pages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#8B95A5]">
              <span>
                Page {tableData.page} of {tableData.pages} ({tableData.total} loads)
              </span>
              <div className="flex items-center gap-1">
                {tableData.page > 1 && (
                  <PaginationLink page={tableData.page - 1} paramsStr={paramsStr} label="← Prev" />
                )}
                {Array.from({ length: Math.min(tableData.pages, 7) }, (_, i) => {
                  const p = i + 1;
                  const isActive = p === tableData.page;
                  const pParams = new URLSearchParams(paramsStr);
                  pParams.set('page', String(p));
                  return (
                    <Link
                      key={p}
                      href={`?${pParams.toString()}`}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                        isActive
                          ? 'bg-[#00C650]/20 border-[#00C650]/40 text-[#00C650]'
                          : 'border-[#1A2235] hover:border-[#2A3245] hover:text-white'
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
                {tableData.page < tableData.pages && (
                  <PaginationLink page={tableData.page + 1} paramsStr={paramsStr} label="Next →" />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaginationLink({ page, paramsStr, label }: { page: number; paramsStr: string; label: string }) {
  const params = new URLSearchParams(paramsStr);
  params.set('page', String(page));
  return (
    <Link
      href={`?${params.toString()}`}
      className="px-3 h-8 flex items-center rounded-lg border border-[#1A2235] hover:border-[#2A3245] hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}
