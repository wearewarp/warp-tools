'use client';

import { Trash2 } from 'lucide-react';
import { IFTA_RATES } from '@/data/ifta-rates';

export interface StateEntry {
  id: string;
  jurisdictionCode: string;
  miles: string;
  gallons: string;
}

interface StateRowProps {
  entry: StateEntry;
  index: number;
  onUpdate: (id: string, field: keyof StateEntry, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export default function StateRow({
  entry,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: StateRowProps) {
  return (
    <tr className="border-b border-warp-border hover:bg-warp-card-hover transition-colors">
      {/* # */}
      <td className="py-3 px-3 text-warp-muted text-sm w-10">
        {index + 1}
      </td>

      {/* State / Jurisdiction */}
      <td className="py-2 px-2">
        <select
          value={entry.jurisdictionCode}
          onChange={(e) => onUpdate(entry.id, 'jurisdictionCode', e.target.value)}
          className="w-full bg-warp-bg border border-warp-border text-white rounded-lg px-3 py-2 text-sm focus:border-warp-accent outline-none"
        >
          <option value="">Select state...</option>
          <optgroup label="United States">
            {IFTA_RATES.filter((r) => r.country === 'US').map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.jurisdiction}
              </option>
            ))}
          </optgroup>
          <optgroup label="Canada">
            {IFTA_RATES.filter((r) => r.country === 'CA').map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.jurisdiction}
              </option>
            ))}
          </optgroup>
        </select>
      </td>

      {/* Miles Driven */}
      <td className="py-2 px-2">
        <input
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={entry.miles}
          onChange={(e) => onUpdate(entry.id, 'miles', e.target.value)}
          className="w-full bg-warp-bg border border-warp-border text-white rounded-lg px-3 py-2 text-sm focus:border-warp-accent outline-none text-right"
        />
      </td>

      {/* Gallons Purchased */}
      <td className="py-2 px-2">
        <input
          type="number"
          min="0"
          step="0.001"
          placeholder="0.000"
          value={entry.gallons}
          onChange={(e) => onUpdate(entry.id, 'gallons', e.target.value)}
          className="w-full bg-warp-bg border border-warp-border text-white rounded-lg px-3 py-2 text-sm focus:border-warp-accent outline-none text-right"
        />
      </td>

      {/* Remove */}
      <td className="py-2 px-2 text-center w-12">
        <button
          onClick={() => onRemove(entry.id)}
          disabled={!canRemove}
          className={`p-1.5 rounded-lg transition-colors ${
            canRemove
              ? 'text-warp-muted hover:text-warp-danger hover:bg-red-900/20'
              : 'text-warp-border cursor-not-allowed'
          }`}
          title="Remove row"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
