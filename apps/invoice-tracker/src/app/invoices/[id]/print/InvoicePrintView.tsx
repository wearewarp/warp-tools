'use client';

import { useEffect } from 'react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  lineType: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
}

interface Props {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    loadRef: string | null;
    notes: string | null;
    status: string;
  };
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerPaymentTerms: string | null;
  lineItems: LineItem[];
  payments: Payment[];
  balanceDue: number;
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const LINE_TYPE_LABELS: Record<string, string> = {
  freight: 'Freight',
  fuel_surcharge: 'Fuel Surcharge',
  detention: 'Detention',
  accessorial: 'Accessorial',
  lumper: 'Lumper',
  other: 'Other',
};

const METHOD_LABELS: Record<string, string> = {
  ach: 'ACH',
  wire: 'Wire',
  check: 'Check',
  credit_card: 'Credit Card',
  factoring: 'Factoring',
  other: 'Other',
};

export function InvoicePrintView({
  invoice,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerPaymentTerms,
  lineItems,
  payments,
  balanceDue,
}: Props) {
  useEffect(() => {
    // Auto-trigger print dialog after render
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, []);

  // Read company info from localStorage
  let company = { companyName: '', companyStreet: '', companyCity: '', companyState: '', companyZip: '', companyEmail: '', companyPhone: '' };
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('warp-invoice-settings');
      if (stored) company = { ...company, ...JSON.parse(stored) };
    } catch {}
  }

  const companyAddr = [company.companyStreet, [company.companyCity, company.companyState].filter(Boolean).join(', '), company.companyZip].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-white">
      {/* Print button (hidden in print) */}
      <div className="print:hidden fixed top-4 right-4 flex gap-3 z-50">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-xl text-sm transition-colors shadow-lg"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-sm transition-colors shadow-lg"
        >
          ← Back
        </button>
      </div>

      {/* Invoice document */}
      <div className="max-w-[800px] mx-auto p-8 print:p-0 print:max-w-none">
        <div className="bg-white text-black font-sans print:shadow-none shadow-xl rounded-lg print:rounded-none p-10">

          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
              <p className="text-lg font-mono text-gray-600 mt-1">{invoice.invoiceNumber}</p>
              {invoice.loadRef && (
                <p className="text-sm text-gray-500 mt-0.5">Load Ref: {invoice.loadRef}</p>
              )}
            </div>
            <div className="text-right">
              {company.companyName && (
                <p className="text-lg font-bold text-gray-900">{company.companyName}</p>
              )}
              {companyAddr && <p className="text-sm text-gray-600">{companyAddr}</p>}
              {company.companyEmail && <p className="text-sm text-gray-600">{company.companyEmail}</p>}
              {company.companyPhone && <p className="text-sm text-gray-600">{company.companyPhone}</p>}
            </div>
          </div>

          {/* Bill To + Dates */}
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              {customerName && <p className="text-base font-semibold text-gray-900">{customerName}</p>}
              {customerAddress && <p className="text-sm text-gray-600">{customerAddress}</p>}
              {customerEmail && <p className="text-sm text-gray-600">{customerEmail}</p>}
              {customerPhone && <p className="text-sm text-gray-600">{customerPhone}</p>}
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice Date</p>
                <p className="text-sm font-medium text-gray-900">{fmtDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</p>
                <p className="text-sm font-medium text-gray-900">{fmtDate(invoice.dueDate)}</p>
              </div>
              {customerPaymentTerms && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Terms</p>
                  <p className="text-sm font-medium text-gray-900">
                    {customerPaymentTerms.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Type</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Qty</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Unit Price</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{li.description}</td>
                  <td className="py-3 text-sm text-gray-500">{LINE_TYPE_LABELS[li.lineType] ?? li.lineType}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{li.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{fmt(li.unitPrice)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">{fmt(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium">{fmt(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900 font-medium">{fmt(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{fmt(invoice.total)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-600 font-medium">- {fmt(invoice.amountPaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-3">
                <span className="text-gray-900">Balance Due</span>
                <span className={balanceDue <= 0 ? 'text-green-600' : 'text-gray-900'}>
                  {balanceDue <= 0 ? 'PAID' : fmt(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 text-sm text-gray-600">{fmtDate(p.paymentDate)}</td>
                      <td className="py-2 text-sm text-green-600 font-medium text-right">{fmt(p.amount)}</td>
                      <td className="py-2 text-sm text-gray-600">{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</td>
                      <td className="py-2 text-sm text-gray-600 font-mono">{p.referenceNumber ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Thank you for your business.
              {company.companyName && ` — ${company.companyName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          @page { margin: 0.75in; size: letter; }
        }
      `}</style>
    </div>
  );
}
