'use client';

import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { marginColor, fmt$, fmtPct } from '@/lib/calc';

interface CarrierRow {
  id: string;
  name: string;
  buyRate: string;
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makeRow(): CarrierRow {
  return { id: makeId(), name: '', buyRate: '' };
}

const INIT_ROWS: CarrierRow[] = [makeRow(), makeRow(), makeRow()];

interface CompareTableProps {
  sellRate: number;
  miles: number;
  rateType: 'per-mile' | 'flat' | 'per-cwt';
  weight: number;
}

export default function CompareTable({ sellRate, miles, rateType, weight }: CompareTableProps) {
  const [rows, setRows] = useState<CarrierRow[]>(INIT_ROWS);

  function getUnits(): number {
    if (rateType === 'per-mile') return miles;
    if (rateType === 'per-cwt') return weight / 100;
    return 1;
  }

  const units = getUnits();
  const revenue = sellRate * units;

  function calcRow(row: CarrierRow) {
    const buy = parseFloat(row.buyRate) || 0;
    const cost = buy * units;
    const margin = revenue - cost;
    const pct = revenue > 0 ? (margin / revenue) * 100 : 0;
    return { cost, margin, pct };
  }

  const computed = rows.map((r) => ({ ...r, ...calcRow(r) }));
  const validRows = computed.filter((r) => parseFloat(r.buyRate) > 0);
  const bestId = validRows.length > 0
    ? validRows.reduce((best, r) => (r.pct > best.pct ? r : best)).id
    : null;

  function updateRow(id: string, field: keyof CarrierRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warp-border">
              <th className="text-left py-2 pr-4 text-warp-muted font-medium">Carrier</th>
              <th className="text-right py-2 px-3 text-warp-muted font-medium">
                {rateType === 'per-mile' ? 'Buy Rate $/mi' : rateType === 'per-cwt' ? 'Buy Rate $/cwt' : 'Buy Rate $'}
              </th>
              <th className="text-right py-2 px-3 text-warp-muted font-medium">Carrier Cost</th>
              <th className="text-right py-2 px-3 text-warp-muted font-medium">Margin $</th>
              <th className="text-right py-2 pl-3 text-warp-muted font-medium">Margin %</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {computed.map((row) => {
              const isBest = row.id === bestId;
              const color = parseFloat(row.buyRate) > 0 ? marginColor(row.pct) : '#8B95A5';
              return (
                <tr
                  key={row.id}
                  className={`border-b border-warp-border/50 transition-colors ${isBest ? 'bg-warp-accent-muted' : ''}`}
                >
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      {isBest && <Star size={12} className="text-warp-accent shrink-0" fill="currentColor" />}
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        placeholder="Carrier name"
                        className="bg-transparent border-b border-warp-border/50 focus:border-warp-accent outline-none w-32 py-0.5 text-sm placeholder:text-warp-muted/40"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.buyRate}
                      onChange={(e) => updateRow(row.id, 'buyRate', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="bg-transparent border-b border-warp-border/50 focus:border-warp-accent outline-none w-24 py-0.5 text-right font-mono text-sm placeholder:text-warp-muted/40"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-warp-muted">
                    {parseFloat(row.buyRate) > 0 ? fmt$(row.cost) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold" style={{ color }}>
                    {parseFloat(row.buyRate) > 0 ? fmt$(row.margin) : '—'}
                  </td>
                  <td className="py-2 pl-3 text-right font-mono font-bold" style={{ color }}>
                    {parseFloat(row.buyRate) > 0 ? fmtPct(row.pct) : '—'}
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-warp-muted hover:text-warp-danger transition-colors"
                      aria-label="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {revenue > 0 && validRows.length > 0 && (
            <tfoot>
              <tr className="border-t border-warp-border">
                <td colSpan={2} className="py-2 text-warp-muted text-xs">
                  Sell rate: {fmt$(sellRate)}{rateType === 'per-mile' ? '/mi' : rateType === 'per-cwt' ? '/cwt' : ''} · Revenue: {fmt$(revenue)}
                </td>
                <td colSpan={3} />
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button
        onClick={addRow}
        className="flex items-center gap-2 text-sm text-warp-accent hover:text-warp-accent/80 transition-colors"
      >
        <Plus size={14} />
        Add carrier
      </button>
      {bestId && (
        <div className="flex items-center gap-2 text-sm text-warp-accent bg-warp-accent-muted rounded-lg px-3 py-2">
          <Star size={13} fill="currentColor" />
          Best option highlighted
        </div>
      )}
    </div>
  );
}
