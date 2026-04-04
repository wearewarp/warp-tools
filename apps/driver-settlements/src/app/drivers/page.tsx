export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/db';
import { drivers, trips } from '@/db/schema';
import { desc, asc, like, or, and, eq, sql } from 'drizzle-orm';
import { formatCurrency, formatDate, cn, getPayTypeColor, getPayTypeLabel, getDriverStatusColor, getDriverStatusLabel } from '@/lib/utils';
import { Users, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { PayType, DriverStatus } from '@/db/schema';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}

function SortHeader({ col, label, currentSort, currentDir, paramsStr }: {
  col: string;
  label: string;
  currentSort: string;
  currentDir: string;
  paramsStr: string;
}) {
  const isActive = currentSort === col;
  const nextDir = isActive && currentDir === 'asc' ? 'desc' : 'asc';
  const p = new URLSearchParams(paramsStr);
  p.set('sort', col);
  p.set('dir', nextDir);
  p.delete('page');
  return (
    <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium whitespace-nowrap">
      <Link href={`?${p.toString()}`} className="flex items-center gap-1 hover:text-white transition-colors">
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

function PaginationLink({ page, paramsStr, label }: { page: number; paramsStr: string; label: string }) {
  const p = new URLSearchParams(paramsStr);
  p.set('page', String(page));
  return (
    <Link href={`?${p.toString()}`} className="px-3 h-8 flex items-center rounded-lg border border-[#1A2235] hover:border-[#2A3245] hover:text-white transition-colors">
      {label}
    </Link>
  );
}

export default async function DriversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = getParam(params.search);
  const status = getParam(params.status);
  const payType = getParam(params.pay_type);
  const sortBy = getParam(params.sort, 'last_name');
  const sortDir = getParam(params.dir, 'asc');
  const page = parseInt(getParam(params.page, '1'), 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(or(
      like(drivers.first_name, `%${search}%`),
      like(drivers.last_name, `%${search}%`),
      like(drivers.email, `%${search}%`),
    ));
  }
  if (status) conditions.push(eq(drivers.status, status as DriverStatus));
  if (payType) conditions.push(eq(drivers.pay_type, payType as PayType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = (() => {
    switch (sortBy) {
      case 'first_name': return drivers.first_name;
      case 'pay_type': return drivers.pay_type;
      case 'pay_rate': return drivers.pay_rate;
      case 'hire_date': return drivers.hire_date;
      case 'status': return drivers.status;
      default: return drivers.last_name;
    }
  })();

  const orderFn = sortDir === 'asc' ? asc : desc;

  const [allDrivers, countResult] = await Promise.all([
    db.select().from(drivers).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(drivers).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pages = Math.ceil(total / limit);

  const yearStart = `${new Date().getFullYear()}-01-01`;
  const driverIds = allDrivers.map(d => d.id);

  const tripStats = driverIds.length > 0
    ? await db
        .select({
          driver_id: trips.driver_id,
          ytd_earnings: sql<number>`sum(case when ${trips.trip_date} >= ${yearStart} then ${trips.pay_amount} else 0 end)`,
          ytd_trips: sql<number>`count(case when ${trips.trip_date} >= ${yearStart} then 1 end)`,
        })
        .from(trips)
        .where(sql`${trips.driver_id} IN (${sql.join(driverIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(trips.driver_id)
    : [];

  const statsMap = new Map(tripStats.map(s => [s.driver_id, s]));

  // Build current params string
  const currentP = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach(val => currentP.append(k, val));
    else if (v) currentP.set(k, v);
  }
  const paramsStr = currentP.toString();

  function filterLink(key: string, val: string) {
    const p = new URLSearchParams(paramsStr);
    if (val) p.set(key, val);
    else p.delete(key);
    p.delete('page');
    return `?${p.toString()}`;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{total} driver{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/drivers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00C650]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <form method="get" action="/drivers" className="relative">
          {status && <input type="hidden" name="status" value={status} />}
          {payType && <input type="hidden" name="pay_type" value={payType} />}
          {sortBy !== 'last_name' && <input type="hidden" name="sort" value={sortBy} />}
          {sortDir !== 'asc' && <input type="hidden" name="dir" value={sortDir} />}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search drivers..."
            className="h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5] px-3 pr-8 focus:outline-none focus:border-[#00C650]/50 w-56"
          />
        </form>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(['', 'active', 'inactive', 'terminated'] as const).map(s => (
            <Link
              key={s}
              href={filterLink('status', s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                status === s
                  ? 'bg-[#00C650]/20 border-[#00C650]/40 text-[#00C650]'
                  : 'border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245]'
              )}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>

        {/* Pay type filter */}
        <div className="flex items-center gap-1">
          {(['', 'per_mile', 'percentage', 'flat', 'hourly', 'per_stop'] as const).map(pt => (
            <Link
              key={pt}
              href={filterLink('pay_type', pt)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                payType === pt
                  ? 'bg-[#00C650]/20 border-[#00C650]/40 text-[#00C650]'
                  : 'border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245]'
              )}
            >
              {pt === '' ? 'All Pay Types' : getPayTypeLabel(pt)}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        {allDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-10 w-10 text-[#1A2235]" />
            <p className="text-sm text-[#8B95A5]">No drivers found.</p>
            <Link href="/drivers/new" className="text-[#00C650] text-sm hover:underline">Add your first driver</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <SortHeader col="last_name" label="Driver" currentSort={sortBy} currentDir={sortDir} paramsStr={paramsStr} />
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">Contact</th>
                  <SortHeader col="pay_type" label="Pay Type" currentSort={sortBy} currentDir={sortDir} paramsStr={paramsStr} />
                  <SortHeader col="pay_rate" label="Rate" currentSort={sortBy} currentDir={sortDir} paramsStr={paramsStr} />
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">YTD Trips</th>
                  <th className="text-left px-4 py-3 text-xs text-[#8B95A5] font-medium">YTD Earnings</th>
                  <SortHeader col="hire_date" label="Hired" currentSort={sortBy} currentDir={sortDir} paramsStr={paramsStr} />
                  <SortHeader col="status" label="Status" currentSort={sortBy} currentDir={sortDir} paramsStr={paramsStr} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {allDrivers.map((driver) => {
                  const stats = statsMap.get(driver.id);
                  return (
                    <tr key={driver.id} className="hover:bg-[#0C1528] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/drivers/${driver.id}`} className="hover:text-[#00C650] transition-colors">
                          <div className="font-medium text-white text-sm">
                            {driver.first_name} {driver.last_name}
                          </div>
                          <div className="text-xs text-[#8B95A5]">
                            {driver.address_city && driver.address_state
                              ? `${driver.address_city}, ${driver.address_state}`
                              : '—'}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-300">{driver.phone ?? '—'}</div>
                        <div className="text-xs text-[#8B95A5]">{driver.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          getPayTypeColor(driver.pay_type)
                        )}>
                          {getPayTypeLabel(driver.pay_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 tabular-nums">
                        {driver.pay_type === 'per_mile' && `$${driver.pay_rate}/mi`}
                        {driver.pay_type === 'percentage' && `${driver.pay_rate}%`}
                        {driver.pay_type === 'flat' && `$${driver.pay_rate}/load`}
                        {driver.pay_type === 'hourly' && `$${driver.pay_rate}/hr`}
                        {driver.pay_type === 'per_stop' && `$${driver.pay_rate}/stop`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 tabular-nums">
                        {stats?.ytd_trips ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#00C650] tabular-nums font-medium">
                        {formatCurrency(stats?.ytd_earnings ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#8B95A5]">{formatDate(driver.hire_date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                          getDriverStatusColor(driver.status)
                        )}>
                          {getDriverStatusLabel(driver.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#8B95A5]">
          <span>Page {page} of {pages} ({total} drivers)</span>
          <div className="flex items-center gap-1">
            {page > 1 && <PaginationLink page={page - 1} paramsStr={paramsStr} label="← Prev" />}
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = i + 1;
              const pp = new URLSearchParams(paramsStr);
              pp.set('page', String(p));
              return (
                <Link
                  key={p}
                  href={`?${pp.toString()}`}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg border transition-colors',
                    p === page
                      ? 'bg-[#00C650]/20 border-[#00C650]/40 text-[#00C650]'
                      : 'border-[#1A2235] hover:border-[#2A3245] hover:text-white'
                  )}
                >
                  {p}
                </Link>
              );
            })}
            {page < pages && <PaginationLink page={page + 1} paramsStr={paramsStr} label="Next →" />}
          </div>
        </div>
      )}
    </div>
  );
}
