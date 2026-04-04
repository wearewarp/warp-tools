'use client';

import { Fuel, Route, Gauge, TrendingUp, TrendingDown } from 'lucide-react';

interface CalculationSummaryProps {
  totalMiles: number;
  totalGallons: number;
  fleetMPG: number;
  totalTaxOwed: number;
  totalTaxPaid: number;
  netTax: number;
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-warp-card border border-warp-border rounded-warp p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg bg-warp-card-hover ${color ?? 'text-warp-muted'}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-warp-muted uppercase tracking-wide mb-0.5">{label}</div>
        <div className={`text-xl font-semibold font-mono ${color ?? 'text-white'}`}>{value}</div>
      </div>
    </div>
  );
}

export default function CalculationSummary({
  totalMiles,
  totalGallons,
  fleetMPG,
  totalTaxOwed,
  totalTaxPaid,
  netTax,
}: CalculationSummaryProps) {
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtGal = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const fmtMpg = (n: number) => (isFinite(n) ? n.toFixed(2) : '—');
  const fmtMoney = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  const netIsOwed = netTax > 0;
  const netIsCredit = netTax < 0;
  const netColor = netIsOwed ? 'text-warp-danger' : netIsCredit ? 'text-warp-accent' : 'text-white';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Total Miles"
          value={fmt(totalMiles)}
          icon={<Route size={18} />}
        />
        <SummaryCard
          label="Total Gallons"
          value={fmtGal(totalGallons)}
          icon={<Fuel size={18} />}
        />
        <SummaryCard
          label="Fleet MPG"
          value={fmtMpg(fleetMPG)}
          icon={<Gauge size={18} />}
        />
        <SummaryCard
          label="Tax Paid"
          value={fmtMoney(totalTaxPaid)}
          icon={<TrendingDown size={18} />}
          color="text-blue-400"
        />
        <SummaryCard
          label="Tax Due"
          value={fmtMoney(totalTaxOwed)}
          icon={<TrendingUp size={18} />}
          color="text-warp-warning"
        />
      </div>

      {/* Net Tax — big prominent card */}
      <div
        className={`rounded-warp border-2 p-5 flex items-center justify-between ${
          netIsOwed
            ? 'border-red-600/40 bg-red-900/10'
            : netIsCredit
            ? 'border-warp-accent/40 bg-warp-accent-muted'
            : 'border-warp-border bg-warp-card'
        }`}
      >
        <div>
          <div className="text-sm text-warp-muted uppercase tracking-wide mb-1">
            {netIsOwed ? '⚠️  Net Tax Owed' : netIsCredit ? '✅  Net Credit' : 'Net Tax'}
          </div>
          <div className={`text-4xl font-bold font-mono ${netColor}`}>
            {netIsOwed ? '+' : netIsCredit ? '−' : ''}
            {fmtMoney(Math.abs(netTax))}
          </div>
          <div className="text-xs text-warp-muted mt-1">
            {netIsOwed
              ? 'Amount due to IFTA member jurisdictions this quarter'
              : netIsCredit
              ? 'Credit to be received from IFTA this quarter'
              : 'Enter mileage and fuel data to calculate'}
          </div>
        </div>
      </div>
    </div>
  );
}
