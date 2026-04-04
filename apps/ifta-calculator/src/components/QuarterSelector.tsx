'use client';

import { IFTA_RATES } from '@/data/ifta-rates';

export type FuelType = 'diesel' | 'gasoline';

interface QuarterSelectorProps {
  quarter: string;
  year: number;
  fuelType: FuelType;
  baseJurisdiction: string;
  onQuarterChange: (q: string) => void;
  onYearChange: (y: number) => void;
  onFuelTypeChange: (f: FuelType) => void;
  onBaseJurisdictionChange: (code: string) => void;
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = [2024, 2025, 2026, 2027];

export default function QuarterSelector({
  quarter,
  year,
  fuelType,
  baseJurisdiction,
  onQuarterChange,
  onYearChange,
  onFuelTypeChange,
  onBaseJurisdictionChange,
}: QuarterSelectorProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Quarter */}
      <div>
        <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
          Quarter
        </label>
        <div className="flex rounded-lg overflow-hidden border border-warp-border">
          {QUARTERS.map((q) => (
            <button
              key={q}
              onClick={() => onQuarterChange(q)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                quarter === q
                  ? 'bg-warp-accent text-black'
                  : 'bg-warp-card text-warp-muted hover:text-white hover:bg-warp-card-hover'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Year */}
      <div>
        <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
          Year
        </label>
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="bg-warp-card border border-warp-border text-white rounded-lg px-3 py-2 text-sm focus:border-warp-accent outline-none"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
          Fuel Type
        </label>
        <div className="flex rounded-lg overflow-hidden border border-warp-border">
          <button
            onClick={() => onFuelTypeChange('diesel')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              fuelType === 'diesel'
                ? 'bg-warp-accent text-black'
                : 'bg-warp-card text-warp-muted hover:text-white hover:bg-warp-card-hover'
            }`}
          >
            Diesel
          </button>
          <button
            onClick={() => onFuelTypeChange('gasoline')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              fuelType === 'gasoline'
                ? 'bg-warp-accent text-black'
                : 'bg-warp-card text-warp-muted hover:text-white hover:bg-warp-card-hover'
            }`}
          >
            Gasoline
          </button>
        </div>
      </div>

      {/* Base Jurisdiction */}
      <div>
        <label className="block text-xs font-medium text-warp-muted mb-1.5 uppercase tracking-wide">
          Base Jurisdiction
        </label>
        <select
          value={baseJurisdiction}
          onChange={(e) => onBaseJurisdictionChange(e.target.value)}
          className="bg-warp-card border border-warp-border text-white rounded-lg px-3 py-2 text-sm focus:border-warp-accent outline-none min-w-[180px]"
        >
          <option value="">Select home state...</option>
          {IFTA_RATES.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.jurisdiction}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
