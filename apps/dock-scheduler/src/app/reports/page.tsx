'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { formatDuration } from '@/lib/utils';

type Tab = 'dwell' | 'utilization' | 'volume' | 'no-shows';

interface DwellRow { carrier: string; count: number; avg_wait: number; avg_dock: number; avg_total: number }
interface UtilRow { door: string; date: string; hours_used: number; hours_available: number; utilization_pct: number }
interface VolumeRow { date: string; total: number; inbound: number; outbound: number }
interface NoShowRow { carrier: string; total: number; no_shows: number; no_show_rate: number }

function colorForDwell(minutes: number): string {
  if (minutes < 45) return 'text-[#00C650]';
  if (minutes < 90) return 'text-[#FFAA00]';
  return 'text-[#FF4444]';
}

function colorForUtil(pct: number): string {
  if (pct >= 80) return 'text-[#00C650]';
  if (pct >= 50) return 'text-[#FFAA00]';
  return 'text-[#FF4444]';
}

function colorForNoShow(rate: number): string {
  if (rate === 0) return 'text-[#00C650]';
  if (rate < 20) return 'text-[#FFAA00]';
  return 'text-[#FF4444]';
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-[#00C650] text-black'
          : 'text-[#8B95A5] hover:text-white hover:bg-[#1A2235]'
      }`}
    >
      {label}
    </button>
  );
}

function DateRangeFilter({ from, to, onFrom, onTo }: {
  from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#8B95A5]">From</span>
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-1.5 text-sm focus:outline-none focus:border-[#00C650]"
      />
      <span className="text-xs text-[#8B95A5]">To</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className="rounded-lg bg-[#0C1528] border border-[#1A2235] text-white px-3 py-1.5 text-sm focus:outline-none focus:border-[#00C650]"
      />
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('dwell');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [dwellData, setDwellData] = useState<DwellRow[]>([]);
  const [utilData, setUtilData] = useState<UtilRow[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeRow[]>([]);
  const [noShowData, setNoShowData] = useState<NoShowRow[]>([]);

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(from && { from }), ...(to && { to }) });
      const endpointMap: Record<Tab, string> = {
        dwell: '/api/reports/dwell-time',
        utilization: '/api/reports/utilization',
        volume: '/api/reports/volume',
        'no-shows': '/api/reports/no-shows',
      };
      const res = await fetch(`${endpointMap[t]}?${params}`);
      const data = await res.json();
      if (t === 'dwell') setDwellData(data.data ?? []);
      if (t === 'utilization') setUtilData(data.data ?? []);
      if (t === 'volume') setVolumeData(data.data ?? []);
      if (t === 'no-shows') setNoShowData(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchTab(tab);
  }, [tab, from, to, fetchTab]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-[#8B95A5] mt-1">Dwell time, utilization, volume, and no-show analytics</p>
      </div>

      {/* Tabs + Date Range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 bg-[#080F1E] border border-[#1A2235] rounded-xl p-1">
          <TabButton label="Dwell Time" active={tab === 'dwell'} onClick={() => setTab('dwell')} />
          <TabButton label="Utilization" active={tab === 'utilization'} onClick={() => setTab('utilization')} />
          <TabButton label="Volume" active={tab === 'volume'} onClick={() => setTab('volume')} />
          <TabButton label="No-Shows" active={tab === 'no-shows'} onClick={() => setTab('no-shows')} />
        </div>
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {/* Content */}
      {loading && <div className="text-sm text-[#8B95A5]">Loading…</div>}

      {/* Dwell Time */}
      {!loading && tab === 'dwell' && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium"># Appts</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Avg Wait</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Avg Dock</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Avg Total</th>
                </tr>
              </thead>
              <tbody>
                {dwellData.map((row) => (
                  <tr key={row.carrier} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528]">
                    <td className="px-5 py-3 text-slate-300">{row.carrier}</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.count}</td>
                    <td className={`px-5 py-3 text-right font-medium ${colorForDwell(row.avg_wait)}`}>{formatDuration(row.avg_wait)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${colorForDwell(row.avg_dock)}`}>{formatDuration(row.avg_dock)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${colorForDwell(row.avg_total)}`}>{formatDuration(row.avg_total)}</td>
                  </tr>
                ))}
                {dwellData.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8B95A5] text-sm">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1A2235] flex gap-4 text-xs text-[#8B95A5]">
            <span className="text-[#00C650]">● &lt;45m good</span>
            <span className="text-[#FFAA00]">● 45–90m slow</span>
            <span className="text-[#FF4444]">● &gt;90m long</span>
          </div>
        </div>
      )}

      {/* Utilization */}
      {!loading && tab === 'utilization' && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Door</th>
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Date</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Hours Used</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Hours Available</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {utilData.map((row, i) => (
                  <tr key={i} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528]">
                    <td className="px-5 py-3 font-mono text-[#00C650] text-xs">{row.door}</td>
                    <td className="px-5 py-3 text-slate-300">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.hours_used}h</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.hours_available}h</td>
                    <td className={`px-5 py-3 text-right font-medium ${colorForUtil(row.utilization_pct)}`}>
                      {row.utilization_pct}%
                    </td>
                  </tr>
                ))}
                {utilData.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8B95A5] text-sm">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1A2235] flex gap-4 text-xs text-[#8B95A5]">
            <span className="text-[#00C650]">● ≥80% high</span>
            <span className="text-[#FFAA00]">● 50–79% medium</span>
            <span className="text-[#FF4444]">● &lt;50% low</span>
          </div>
        </div>
      )}

      {/* Volume */}
      {!loading && tab === 'volume' && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Date</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Total</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Inbound</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Outbound</th>
                </tr>
              </thead>
              <tbody>
                {volumeData.map((row) => (
                  <tr key={row.date} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528]">
                    <td className="px-5 py-3 text-slate-300">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 text-right font-medium text-white">{row.total}</td>
                    <td className="px-5 py-3 text-right text-blue-400">{row.inbound}</td>
                    <td className="px-5 py-3 text-right text-purple-400">{row.outbound}</td>
                  </tr>
                ))}
                {volumeData.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[#8B95A5] text-sm">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No-Shows */}
      {!loading && tab === 'no-shows' && (
        <div className="rounded-xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A2235]">
                  <th className="text-left px-5 py-3 text-xs text-[#8B95A5] font-medium">Carrier</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">Total Appts</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">No-Shows</th>
                  <th className="text-right px-5 py-3 text-xs text-[#8B95A5] font-medium">No-Show Rate</th>
                </tr>
              </thead>
              <tbody>
                {noShowData.map((row) => (
                  <tr key={row.carrier} className="border-b border-[#1A2235] last:border-0 hover:bg-[#0C1528]">
                    <td className="px-5 py-3 text-slate-300">{row.carrier}</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.total}</td>
                    <td className="px-5 py-3 text-right text-[#8B95A5]">{row.no_shows}</td>
                    <td className={`px-5 py-3 text-right font-medium ${colorForNoShow(row.no_show_rate)}`}>
                      {row.no_show_rate}%
                    </td>
                  </tr>
                ))}
                {noShowData.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-[#8B95A5] text-sm">No data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[#1A2235] flex gap-4 text-xs text-[#8B95A5]">
            <span className="text-[#00C650]">● 0% perfect</span>
            <span className="text-[#FFAA00]">● &lt;20% moderate</span>
            <span className="text-[#FF4444]">● ≥20% high</span>
          </div>
        </div>
      )}
    </div>
  );
}
