'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

type Tab = 'volume' | 'revenue' | 'performance' | 'documents' | 'customers' | 'carriers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'volume', label: 'Volume' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'performance', label: 'Performance' },
  { key: 'documents', label: 'Documents' },
  { key: 'customers', label: 'Customers' },
  { key: 'carriers', label: 'Carriers' },
];

function Pct({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-[#8B95A5]">—</span>;
  const color = value >= 90 ? 'text-green-400' : value >= 75 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{value.toFixed(1)}%</span>;
}

function MarginPct({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-[#8B95A5]">—</span>;
  const color = value >= 20 ? 'text-green-400' : value >= 12 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{value.toFixed(1)}%</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2.5 text-xs font-medium text-[#8B95A5] whitespace-nowrap border-b border-[#1A2235]">
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <td className={`px-3 py-2.5 text-sm text-[#8B95A5] ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </td>
  );
}

export function ReportsClient() {
  const [tab, setTab] = useState<Tab>('volume');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dateFrom, dateTo]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/reports/${tab}?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#8B95A5]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#8B95A5]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#0C1528] border border-[#1A2235] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#00C650]/50"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-[#8B95A5] hover:text-white underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#080F1E] border border-[#1A2235] rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              tab === t.key
                ? 'bg-[#1A2235] text-white'
                : 'text-[#8B95A5] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#8B95A5] text-sm py-8 text-center">Loading…</div>
      ) : !data ? null : (
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-warp overflow-hidden">
          {/* VOLUME TAB */}
          {tab === 'volume' && (
            <div className="p-4 space-y-6">
              <div className="text-lg font-bold text-white">{(data as { total: number }).total} shipments</div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Month</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Month</Th><Th>Count</Th></tr></thead>
                    <tbody>
                      {(data as { byMonth: { month: string; count: number }[] }).byMonth.map((row) => (
                        <tr key={row.month} className="border-t border-[#1A2235]/50">
                          <Td>{row.month}</Td>
                          <Td align="right"><span className="text-white font-medium">{row.count}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Customer</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Customer</Th><Th>Count</Th></tr></thead>
                    <tbody>
                      {(data as { byCustomer: { customer: string; count: number }[] }).byCustomer.map((row) => (
                        <tr key={row.customer} className="border-t border-[#1A2235]/50">
                          <Td>{row.customer}</Td>
                          <Td align="right"><span className="text-white font-medium">{row.count}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Equipment</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Equipment</Th><Th>Count</Th></tr></thead>
                    <tbody>
                      {Object.entries((data as { byEquipment: Record<string, number> }).byEquipment).sort(([, a], [, b]) => b - a).map(([eq, count]) => (
                        <tr key={eq} className="border-t border-[#1A2235]/50">
                          <Td>{eq.replace('_', ' ')}</Td>
                          <Td align="right"><span className="text-white font-medium">{count}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Status</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Status</Th><Th>Count</Th></tr></thead>
                    <tbody>
                      {Object.entries((data as { byStatus: Record<string, number> }).byStatus).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                        <tr key={status} className="border-t border-[#1A2235]/50">
                          <Td>{status.replace('_', ' ')}</Td>
                          <Td align="right"><span className="text-white font-medium">{count}</span></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {tab === 'revenue' && (
            <div className="p-4 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrency((data as { totals: { totalRevenue: number } }).totals.totalRevenue) },
                  { label: 'Total Cost', value: formatCurrency((data as { totals: { totalCost: number } }).totals.totalCost) },
                  { label: 'Total Margin', value: formatCurrency((data as { totals: { totalMargin: number } }).totals.totalMargin) },
                  { label: 'Avg Margin %', value: `${(data as { totals: { avgMarginPct: number } }).totals.avgMarginPct.toFixed(1)}%` },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#0C1528] border border-[#1A2235] rounded-lg p-3">
                    <div className="text-xs text-[#8B95A5] mb-1">{kpi.label}</div>
                    <div className="text-lg font-bold text-white">{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Month</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Month</Th><Th>Revenue</Th><Th>Cost</Th><Th>Margin %</Th></tr></thead>
                    <tbody>
                      {(data as { byMonth: { month: string; revenue: number; cost: number; marginPct: number }[] }).byMonth.map((row) => (
                        <tr key={row.month} className="border-t border-[#1A2235]/50">
                          <Td>{row.month}</Td>
                          <Td><span className="text-white">{formatCurrency(row.revenue)}</span></Td>
                          <Td><span className="text-[#8B95A5]">{formatCurrency(row.cost)}</span></Td>
                          <Td><MarginPct value={row.marginPct} /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Customer</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Customer</Th><Th>Revenue</Th><Th>Margin %</Th></tr></thead>
                    <tbody>
                      {(data as { byCustomer: { customer: string; revenue: number; marginPct: number }[] }).byCustomer.map((row) => (
                        <tr key={row.customer} className="border-t border-[#1A2235]/50">
                          <Td>{row.customer}</Td>
                          <Td><span className="text-white">{formatCurrency(row.revenue)}</span></Td>
                          <Td><MarginPct value={row.marginPct} /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">By Carrier</h3>
                  <table className="w-full text-sm">
                    <thead><tr><Th>Carrier</Th><Th>Revenue</Th><Th>Cost</Th><Th>Margin %</Th></tr></thead>
                    <tbody>
                      {(data as { byCarrier: { carrier: string; revenue: number; cost: number; marginPct: number }[] }).byCarrier.map((row) => (
                        <tr key={row.carrier} className="border-t border-[#1A2235]/50">
                          <Td>{row.carrier}</Td>
                          <Td><span className="text-white">{formatCurrency(row.revenue)}</span></Td>
                          <Td><span className="text-[#8B95A5]">{formatCurrency(row.cost)}</span></Td>
                          <Td><MarginPct value={row.marginPct} /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {tab === 'performance' && (
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0C1528] border border-[#1A2235] rounded-lg p-3">
                  <div className="text-xs text-[#8B95A5] mb-1">Overall On-Time Pickup</div>
                  <Pct value={(data as { overall: { pickupOnTimePct: number } }).overall.pickupOnTimePct} />
                </div>
                <div className="bg-[#0C1528] border border-[#1A2235] rounded-lg p-3">
                  <div className="text-xs text-[#8B95A5] mb-1">Overall On-Time Delivery</div>
                  <Pct value={(data as { overall: { deliveryOnTimePct: number } }).overall.deliveryOnTimePct} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">By Carrier</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Carrier</Th>
                      <Th>Shipments</Th>
                      <Th>On-Time Pickup</Th>
                      <Th>On-Time Delivery</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data as { byCarrier: { carrier: string; count: number; pickupOnTimePct: number | null; deliveryOnTimePct: number | null }[] }).byCarrier.map((row) => (
                      <tr key={row.carrier} className="border-t border-[#1A2235]/50">
                        <Td>{row.carrier}</Td>
                        <Td><span className="text-white">{row.count}</span></Td>
                        <Td><Pct value={row.pickupOnTimePct} /></Td>
                        <Td><Pct value={row.deliveryOnTimePct} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {tab === 'documents' && (
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'BOL', value: (data as { docCounts: { bol: { pct: number } } }).docCounts.bol.pct },
                  { label: 'POD', value: (data as { docCounts: { pod: { pct: number } } }).docCounts.pod.pct },
                  { label: 'Rate Con', value: (data as { docCounts: { rateCon: { pct: number } } }).docCounts.rateCon.pct },
                  { label: 'Invoice', value: (data as { docCounts: { invoice: { pct: number } } }).docCounts.invoice.pct },
                ].map((doc) => (
                  <div key={doc.label} className="bg-[#0C1528] border border-[#1A2235] rounded-lg p-3">
                    <div className="text-xs text-[#8B95A5] mb-1">{doc.label}</div>
                    <Pct value={doc.value} />
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">By Status</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Status</Th>
                      <Th>Count</Th>
                      <Th>BOL</Th>
                      <Th>POD</Th>
                      <Th>Rate Con</Th>
                      <Th>Invoice</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries((data as { byStatus: Record<string, { total: number; bolPct: number; podPct: number; rateConPct: number; invoicePct: number }> }).byStatus).map(([status, row]) => (
                      <tr key={status} className="border-t border-[#1A2235]/50">
                        <Td>{status.replace('_', ' ')}</Td>
                        <Td><span className="text-white">{row.total}</span></Td>
                        <Td><Pct value={row.bolPct} /></Td>
                        <Td><Pct value={row.podPct} /></Td>
                        <Td><Pct value={row.rateConPct} /></Td>
                        <Td><Pct value={row.invoicePct} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {tab === 'customers' && (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Customer</Th>
                    <Th>Shipments</Th>
                    <Th>Revenue</Th>
                    <Th>Margin %</Th>
                    <Th>On-Time %</Th>
                  </tr>
                </thead>
                <tbody>
                  {(data as { customers: { customer: string; count: number; revenue: number; marginPct: number | null; onTimePct: number | null }[] }).customers.map((row) => (
                    <tr key={row.customer} className="border-t border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                      <Td>
                        <a href={`/shipments?customer=${encodeURIComponent(row.customer)}`} className="text-white hover:text-[#00C650] hover:underline">
                          {row.customer}
                        </a>
                      </Td>
                      <Td><span className="text-white">{row.count}</span></Td>
                      <Td><span className="text-white">{formatCurrency(row.revenue)}</span></Td>
                      <Td><MarginPct value={row.marginPct} /></Td>
                      <Td><Pct value={row.onTimePct} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CARRIERS TAB */}
          {tab === 'carriers' && (
            <div className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Carrier</Th>
                    <Th>Shipments</Th>
                    <Th>Cost</Th>
                    <Th>Margin %</Th>
                    <Th>On-Time %</Th>
                  </tr>
                </thead>
                <tbody>
                  {(data as { carriers: { carrier: string; count: number; cost: number; marginPct: number | null; onTimePct: number | null }[] }).carriers.map((row) => (
                    <tr key={row.carrier} className="border-t border-[#1A2235]/50 hover:bg-[#0C1528] transition-colors">
                      <Td>
                        <a href={`/shipments?carrier=${encodeURIComponent(row.carrier)}`} className="text-white hover:text-[#00C650] hover:underline">
                          {row.carrier}
                        </a>
                      </Td>
                      <Td><span className="text-white">{row.count}</span></Td>
                      <Td><span className="text-white">{formatCurrency(row.cost)}</span></Td>
                      <Td><MarginPct value={row.marginPct} /></Td>
                      <Td><Pct value={row.onTimePct} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
