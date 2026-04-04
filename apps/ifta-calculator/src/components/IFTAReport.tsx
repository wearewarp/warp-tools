'use client';

import { Printer, Download } from 'lucide-react';
import { getRateByCode } from '@/data/ifta-rates';
import type { FuelType } from '@/components/QuarterSelector';
import type { StateEntry } from '@/components/StateRow';

interface ReportRow {
  code: string;
  jurisdiction: string;
  totalMiles: number;
  taxableGallons: number;
  taxRate: number;
  taxDue: number;
  taxPaid: number;
  netTax: number;
}

interface IFTAReportProps {
  entries: StateEntry[];
  fuelType: FuelType;
  fleetMPG: number;
  quarter: string;
  year: number;
  baseJurisdiction: string;
}

function buildReportRows(
  entries: StateEntry[],
  fuelType: FuelType,
  fleetMPG: number
): ReportRow[] {
  const rows: ReportRow[] = [];

  for (const entry of entries) {
    if (!entry.jurisdictionCode) continue;
    const miles = parseFloat(entry.miles) || 0;
    const gallonsPurchased = parseFloat(entry.gallons) || 0;
    if (miles === 0 && gallonsPurchased === 0) continue;

    const rateInfo = getRateByCode(entry.jurisdictionCode);
    if (!rateInfo) continue;

    const taxRate =
      fuelType === 'diesel' ? rateInfo.dieselRate : rateInfo.gasolineRate;
    const taxableGallons = fleetMPG > 0 ? miles / fleetMPG : 0;
    const taxDue = taxableGallons * taxRate;
    const taxPaid = gallonsPurchased * taxRate;
    const netTax = taxDue - taxPaid;

    rows.push({
      code: entry.jurisdictionCode,
      jurisdiction: rateInfo.jurisdiction,
      totalMiles: miles,
      taxableGallons,
      taxRate,
      taxDue,
      taxPaid,
      netTax,
    });
  }

  return rows.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));
}

function exportCSV(
  rows: ReportRow[],
  quarter: string,
  year: number,
  fuelType: FuelType
) {
  const headers = [
    'Jurisdiction',
    'Code',
    'Total Miles',
    'Taxable Gallons',
    'Tax Rate ($/gal)',
    'Tax Due ($)',
    'Tax Paid ($)',
    'Net Tax ($)',
  ];

  const totalMiles = rows.reduce((s, r) => s + r.totalMiles, 0);
  const totalTaxableGallons = rows.reduce((s, r) => s + r.taxableGallons, 0);
  const totalTaxDue = rows.reduce((s, r) => s + r.taxDue, 0);
  const totalTaxPaid = rows.reduce((s, r) => s + r.taxPaid, 0);
  const totalNetTax = rows.reduce((s, r) => s + r.netTax, 0);

  const csvRows = [
    [`IFTA Fuel Tax Report — ${quarter} ${year} — ${fuelType.toUpperCase()}`],
    [],
    headers,
    ...rows.map((r) => [
      r.jurisdiction,
      r.code,
      r.totalMiles.toFixed(0),
      r.taxableGallons.toFixed(3),
      r.taxRate.toFixed(4),
      r.taxDue.toFixed(2),
      r.taxPaid.toFixed(2),
      r.netTax.toFixed(2),
    ]),
    [
      'TOTALS',
      '',
      totalMiles.toFixed(0),
      totalTaxableGallons.toFixed(3),
      '',
      totalTaxDue.toFixed(2),
      totalTaxPaid.toFixed(2),
      totalNetTax.toFixed(2),
    ],
  ];

  const csv = csvRows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ifta-report-${quarter}-${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function IFTAReport({
  entries,
  fuelType,
  fleetMPG,
  quarter,
  year,
  baseJurisdiction,
}: IFTAReportProps) {
  const rows = buildReportRows(entries, fuelType, fleetMPG);

  const totalMiles = rows.reduce((s, r) => s + r.totalMiles, 0);
  const totalTaxableGallons = rows.reduce((s, r) => s + r.taxableGallons, 0);
  const totalTaxDue = rows.reduce((s, r) => s + r.taxDue, 0);
  const totalTaxPaid = rows.reduce((s, r) => s + r.taxPaid, 0);
  const totalNetTax = rows.reduce((s, r) => s + r.netTax, 0);

  const fmtMoney = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const fmtGal = (n: number) => n.toFixed(3);

  return (
    <div>
      {/* Report header */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div>
          <h2 className="text-lg font-semibold text-white">IFTA Quarterly Report</h2>
          <p className="text-sm text-warp-muted">
            {quarter} {year} · {fuelType.charAt(0).toUpperCase() + fuelType.slice(1)}
            {baseJurisdiction ? ` · Base: ${baseJurisdiction}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(rows, quarter, year, fuelType)}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-warp-card border border-warp-border text-warp-muted hover:text-white hover:border-warp-accent/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-warp-accent text-black font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer size={15} />
            Print Report
          </button>
        </div>
      </div>

      {/* Print header — shown only in print */}
      <div className="hidden print-only mb-6">
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
          IFTA Fuel Tax Report
        </h1>
        <p style={{ color: '#555', fontSize: '13px' }}>
          {quarter} {year} &nbsp;|&nbsp; {fuelType.toUpperCase()}
          {baseJurisdiction ? ` | Base Jurisdiction: ${baseJurisdiction}` : ''}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-warp-muted border border-warp-border rounded-warp bg-warp-card">
          Enter mileage and fuel data above to generate your IFTA report.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-warp border border-warp-border print-section">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warp-border bg-warp-card-hover">
                <th className="text-left py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Jurisdiction
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Total Miles
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Taxable Gallons
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Tax Rate
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Tax Due
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Tax Paid
                </th>
                <th className="text-right py-3 px-4 text-warp-muted font-medium text-xs uppercase tracking-wide">
                  Net Tax
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.code}
                  className="border-b border-warp-border hover:bg-warp-card-hover transition-colors"
                >
                  <td className="py-3 px-4 text-white font-medium">
                    {row.code} — {row.jurisdiction}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">
                    {row.totalMiles.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">
                    {fmtGal(row.taxableGallons)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-warp-muted">
                    ${row.taxRate.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-warp-warning">
                    {fmtMoney(row.taxDue)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-400">
                    {fmtMoney(row.taxPaid)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${
                      row.netTax > 0
                        ? 'text-warp-danger'
                        : row.netTax < 0
                        ? 'text-warp-accent'
                        : 'text-warp-muted'
                    }`}
                  >
                    {row.netTax > 0 ? '+' : row.netTax < 0 ? '−' : ''}
                    {fmtMoney(Math.abs(row.netTax))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-warp-border bg-warp-card-hover font-semibold">
                <td className="py-3 px-4 text-white uppercase text-xs tracking-wide">
                  Totals
                </td>
                <td className="py-3 px-4 text-right font-mono text-white">
                  {totalMiles.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-white">
                  {fmtGal(totalTaxableGallons)}
                </td>
                <td className="py-3 px-4" />
                <td className="py-3 px-4 text-right font-mono text-warp-warning">
                  {fmtMoney(totalTaxDue)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-400">
                  {fmtMoney(totalTaxPaid)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono font-bold text-lg ${
                    totalNetTax > 0
                      ? 'text-warp-danger'
                      : totalNetTax < 0
                      ? 'text-warp-accent'
                      : 'text-warp-muted'
                  }`}
                >
                  {totalNetTax > 0 ? '+' : totalNetTax < 0 ? '−' : ''}
                  {fmtMoney(Math.abs(totalNetTax))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
