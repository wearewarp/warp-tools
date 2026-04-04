'use client';

import { useState } from 'react';
import { Plus, Trash2, ClipboardPaste } from 'lucide-react';
import { marginColor, fmt$, fmtPct } from '@/lib/calc';

interface BatchRow {
  id: string;
  ref: string;
  sellRate: string;
  buyRate: string;
  miles: string;
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function makeRow(): BatchRow {
  return { id: makeId(), ref: '', sellRate: '', buyRate: '', miles: '' };
}

const INIT_ROWS: BatchRow[] = [makeRow(), makeRow(), makeRow()];

function calcBatchRow(row: BatchRow) {
  const sell = parseFloat(row.sellRate) || 0;
  const buy = parseFloat(row.buyRate) || 0;
  const mi = parseFloat(row.miles) || 1;
  const revenue = sell * mi;
  const cost = buy * mi;
  const margin = revenue - cost;
  const pct = revenue > 0 ? (margin / revenue) * 100 : 0;
  return { revenue, cost, margin, pct };
}

export default function BatchEntry() {
  const [rows, setRows] = useState<BatchRow[]>(INIT_ROWS);

  function updateRow(id: string, field: keyof BatchRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.trim().split('\n').filter((l) => l.trim());
    const newRows: BatchRow[] = lines.map((line) => {
      const cols = line.split(/\t|,/).map((c) => c.trim());
      return {
        id: makeId(),
        ref: cols[0] || '',
        sellRate: cols[1] || '',
        buyRate: cols[2] || '',
        miles: cols[3] || '',
      };
    });
    if (newRows.length > 0) setRows(newRows);
  }

  const computed = rows.map((r) => ({ ...r, ...calcBatchRow(r) }));
  const validRows = computed.filter(
    (r) => parseFloat(r.sellRate) > 0 && parseFloat(r.buyRate) > 0
  );

  const totals = validRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      cost: acc.cost + r.cost,
      margin: acc.margin + r.margin,
    }),
    { revenue: 0, cost: 0, margin: 0 }
  );
  const avgPct = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  function applyPasteText() {
    const lines = pasteText.trim().split('\n').filter((l) => l.trim());
    const newRows: BatchRow[] = lines.map((line) => {
      const cols = line.split(/\t|,/).map((c) => c.trim());
      return {
        id: makeId(),
        ref: cols[0] || '',
        sellRate: cols[1] || '',
        buyRate: cols[2] || '',
        miles: cols[3] || '',
      };
    });
    if (newRows.length > 0) {
      setRows(newRows);
      setPasteText('');
      setShowPaste(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Paste helper */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex items-center gap-2 text-sm text-warp-muted hover:text-warp-accent transition-colors border border-warp-border rounded-lg px-3 py-1.5"
        >
          <ClipboardPaste size={13} />
          Paste from spreadsheet
        </button>
        <span className="text-xs text-warp-muted">Format: Load Ref, Sell Rate, Buy Rate, Miles</span>
      </div>

      {showPaste && (
        <div className="space-y-2">
          <textarea
            className="w-full bg-warp-card border border-warp-border rounded-lg p-3 text-sm font-mono text-white placeholder:text-warp-muted/50 focus:outline-none focus:border-warp-accent resize-none"
            rows={5}
            placeholder={'LOAD001\t2.50\t2.10\t450\nLOAD002\t3.00\t2.40\t320'}
            value={pasteText}
            onPaste={handlePaste}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={applyPasteText}
              className="bg-warp-accent text-black font-semibold rounded-lg px-4 py-1.5 text-sm hover:bg-warp-accent/90 transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setShowPaste(false)}
              className="text-sm text-warp-muted hover:text-white transition-colors px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warp-border">
              <th className="text-left py-2 pr-3 text-warp-muted font-medium">Load Ref</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Sell Rate $/mi</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Buy Rate $/mi</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Miles</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Revenue</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Cost</th>
              <th className="text-right py-2 px-2 text-warp-muted font-medium">Margin $</th>
              <th className="text-right py-2 pl-2 text-warp-muted font-medium">Margin %</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {computed.map((row) => {
              const hasData = parseFloat(row.sellRate) > 0 && parseFloat(row.buyRate) > 0;
              const color = hasData ? marginColor(row.pct) : '#8B95A5';
              const rowBg = hasData
                ? row.pct >= 15
                  ? 'rgba(0,198,80,0.04)'
                  : row.pct >= 10
                  ? 'rgba(255,170,0,0.05)'
                  : 'rgba(255,68,68,0.05)'
                : 'transparent';
              return (
                <tr
                  key={row.id}
                  className="border-b border-warp-border/40 transition-colors"
                  style={{ backgroundColor: rowBg }}
                >
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      value={row.ref}
                      onChange={(e) => updateRow(row.id, 'ref', e.target.value)}
                      placeholder="REF-001"
                      className="bg-transparent border-b border-warp-border/50 focus:border-warp-accent outline-none w-24 py-0.5 text-sm placeholder:text-warp-muted/40"
                    />
                  </td>
                  {(['sellRate', 'buyRate', 'miles'] as const).map((field) => (
                    <td key={field} className="py-1.5 px-2">
                      <input
                        type="number"
                        value={row[field]}
                        onChange={(e) => updateRow(row.id, field, e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="bg-transparent border-b border-warp-border/50 focus:border-warp-accent outline-none w-20 py-0.5 text-right font-mono text-sm placeholder:text-warp-muted/40"
                      />
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-right font-mono text-warp-muted text-xs">
                    {hasData ? fmt$(row.revenue) : '—'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-warp-muted text-xs">
                    {hasData ? fmt$(row.cost) : '—'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-xs" style={{ color }}>
                    {hasData ? fmt$(row.margin) : '—'}
                  </td>
                  <td className="py-1.5 pl-2 text-right font-mono font-bold text-xs" style={{ color }}>
                    {hasData ? fmtPct(row.pct) : '—'}
                  </td>
                  <td className="py-1.5 pl-2">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-warp-muted hover:text-warp-danger transition-colors"
                      aria-label="Remove row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {validRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-warp-border bg-warp-card">
                <td className="py-2 pr-3 font-semibold text-white">Totals</td>
                <td colSpan={3} className="py-2 px-2 text-warp-muted text-xs text-right">
                  {validRows.length} loads
                </td>
                <td className="py-2 px-2 text-right font-mono font-semibold text-warp-accent text-xs">
                  {fmt$(totals.revenue)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-warp-muted text-xs">
                  {fmt$(totals.cost)}
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold text-xs" style={{ color: marginColor(avgPct) }}>
                  {fmt$(totals.margin)}
                </td>
                <td className="py-2 pl-2 text-right font-mono font-bold text-xs" style={{ color: marginColor(avgPct) }}>
                  {fmtPct(avgPct)} avg
                </td>
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
        Add load
      </button>
    </div>
  );
}
