import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  settlements,
  drivers,
  trips,
  settlementDeductions,
  settlementReimbursements,
  advances,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(date: string | null | undefined) {
  if (!date) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId));
  if (!settlement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, settlement.driver_id));
  const tripRows = await db.select().from(trips).where(eq(trips.settlement_id, settlementId)).orderBy(trips.trip_date);
  const deductionRows = await db.select().from(settlementDeductions).where(eq(settlementDeductions.settlement_id, settlementId));
  const reimbursementRows = await db.select().from(settlementReimbursements).where(eq(settlementReimbursements.settlement_id, settlementId));
  const advanceRows = await db.select().from(advances).where(eq(advances.settlement_id, settlementId));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Settlement ${settlement.settlement_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px; }
  h1 { font-size: 20px; font-weight: bold; }
  h2 { font-size: 14px; font-weight: bold; margin: 24px 0 8px; border-bottom: 2px solid #111; padding-bottom: 4px; }
  h3 { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .company { font-size: 11px; color: #555; }
  .settlement-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; background: #f8f8f8; padding: 12px; border-radius: 4px; }
  .info-item { }
  .info-label { font-size: 10px; text-transform: uppercase; color: #666; }
  .info-value { font-size: 12px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; border: 1px solid #ddd; }
  th.right { text-align: right; }
  td { padding: 5px 8px; border: 1px solid #eee; font-size: 11px; }
  td.right { text-align: right; }
  .total-row td { font-weight: bold; background: #f8f8f8; }
  .net-pay { margin-top: 24px; padding: 16px; border: 2px solid #111; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
  .net-pay-label { font-size: 14px; font-weight: bold; }
  .net-pay-amount { font-size: 24px; font-weight: bold; }
  .formula { margin-top: 8px; font-size: 11px; color: #555; }
  @media print {
    body { padding: 16px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Driver Settlement Statement</h1>
      <div class="company" id="company-name">Warp Tools Transport</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:bold">${settlement.settlement_number}</div>
      <div style="font-size:11px;color:#555">Period: ${fmtDate(settlement.period_start)} – ${fmtDate(settlement.period_end)}</div>
      <div style="font-size:11px;color:#555">Status: ${settlement.status.toUpperCase()}</div>
      ${settlement.paid_date ? `<div style="font-size:11px;color:#555">Paid: ${fmtDate(settlement.paid_date)}</div>` : ''}
    </div>
  </div>

  <div class="settlement-info">
    <div class="info-item">
      <div class="info-label">Driver</div>
      <div class="info-value">${driver ? `${driver.first_name} ${driver.last_name}` : 'N/A'}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Pay Type</div>
      <div class="info-value">${driver?.pay_type?.replace('_', ' ') ?? 'N/A'} @ ${driver?.pay_type === 'percentage' ? driver.pay_rate + '%' : '$' + driver?.pay_rate}</div>
    </div>
    ${settlement.payment_method ? `<div class="info-item"><div class="info-label">Payment Method</div><div class="info-value">${settlement.payment_method.toUpperCase()}</div></div>` : ''}
    ${settlement.payment_reference ? `<div class="info-item"><div class="info-label">Reference</div><div class="info-value">${settlement.payment_reference}</div></div>` : ''}
    ${settlement.approved_by ? `<div class="info-item"><div class="info-label">Approved By</div><div class="info-value">${settlement.approved_by}</div></div>` : ''}
  </div>

  <h2>Earnings</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Load Ref</th>
        <th>Origin</th>
        <th>Destination</th>
        <th class="right">Miles</th>
        <th class="right">Revenue</th>
        <th class="right">Pay</th>
      </tr>
    </thead>
    <tbody>
      ${tripRows.map((t) => `
      <tr>
        <td>${fmtDate(t.trip_date)}</td>
        <td>${t.load_ref ?? '—'}</td>
        <td>${t.origin_city}, ${t.origin_state}</td>
        <td>${t.dest_city}, ${t.dest_state}</td>
        <td class="right">${t.miles ?? '—'}</td>
        <td class="right">${t.revenue != null ? fmt(t.revenue) : '—'}</td>
        <td class="right">${fmt(t.pay_amount)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="6">Gross Earnings</td>
        <td class="right">${fmt(settlement.gross_earnings)}</td>
      </tr>
    </tbody>
  </table>

  ${deductionRows.length > 0 ? `
  <h2>Deductions</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Category</th>
        <th>Type</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${deductionRows.map((d) => `
      <tr>
        <td>${d.description}</td>
        <td>${d.category}</td>
        <td>${d.deduction_type}</td>
        <td class="right">-${fmt(d.amount)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="3">Total Deductions</td>
        <td class="right">-${fmt(settlement.total_deductions)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  ${reimbursementRows.length > 0 ? `
  <h2>Reimbursements</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Category</th>
        <th>Receipt Ref</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${reimbursementRows.map((r) => `
      <tr>
        <td>${r.description}</td>
        <td>${r.category}</td>
        <td>${r.receipt_ref ?? '—'}</td>
        <td class="right">+${fmt(r.amount)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="3">Total Reimbursements</td>
        <td class="right">+${fmt(settlement.total_reimbursements)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  ${advanceRows.length > 0 ? `
  <h2>Advance Deductions</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Reason</th>
        <th>Status</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${advanceRows.map((a) => `
      <tr>
        <td>${fmtDate(a.date)}</td>
        <td>${a.reason ?? '—'}</td>
        <td>${a.status}</td>
        <td class="right">-${fmt(a.amount)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="3">Total Advances</td>
        <td class="right">-${fmt(settlement.total_advances)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  <div class="net-pay">
    <div>
      <div class="net-pay-label">NET PAY</div>
      <div class="formula">
        ${fmt(settlement.gross_earnings)} gross
        − ${fmt(settlement.total_deductions)} deductions
        − ${fmt(settlement.total_advances)} advances
        + ${fmt(settlement.total_reimbursements)} reimbursements
      </div>
    </div>
    <div class="net-pay-amount">${fmt(settlement.net_pay)}</div>
  </div>

  ${settlement.notes ? `<div style="margin-top:16px;font-size:11px;color:#555"><strong>Notes:</strong> ${settlement.notes}</div>` : ''}

  <div style="margin-top:32px;font-size:10px;color:#aaa;text-align:center">
    Generated by Warp Tools — Driver Settlement System
  </div>

  <script>
    // Load company name from localStorage if available
    try {
      const settings = JSON.parse(localStorage.getItem('ds-settings') || '{}');
      if (settings.companyName) {
        document.getElementById('company-name').textContent = settings.companyName;
      }
    } catch(e) {}
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
