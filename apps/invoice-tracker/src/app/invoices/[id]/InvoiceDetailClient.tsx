'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil, Send, Trash2, Mail, Plus, Pencil as PencilIcon, X
} from 'lucide-react';
import { InvoiceStatusBadge } from '@/components/InvoiceStatusBadge';
import { LineTypeBadge } from '@/components/LineTypeBadge';
import { RecordPaymentModal } from '@/components/RecordPaymentModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';

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
  notes: string | null;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  loadRef: string | null;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  effectiveStatus: string;
  status: string;
  notes: string | null;
  lineItems: LineItem[];
  payments: Payment[];
}

const METHOD_LABELS: Record<string, string> = {
  ach: 'ACH',
  wire: 'Wire',
  check: 'Check',
  credit_card: 'Credit Card',
  factoring: 'Factoring',
  other: 'Other',
};

const inputClass =
  'w-full px-2.5 py-1.5 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors';

const LINE_TYPES = ['freight', 'fuel_surcharge', 'detention', 'accessorial', 'lumper', 'other'] as const;

export function InvoiceDetailClient({ invoice: initialInvoice }: { invoice: InvoiceData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Inline line item add state
  const [addingLineItem, setAddingLineItem] = useState(false);
  const [lineItemDraft, setLineItemDraft] = useState({
    description: '',
    quantity: '1',
    unitPrice: '',
    lineType: 'freight' as typeof LINE_TYPES[number],
  });
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [lineItemEditDraft, setLineItemEditDraft] = useState({
    description: '',
    quantity: '1',
    unitPrice: '',
    lineType: 'freight' as typeof LINE_TYPES[number],
  });

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/invoices/${invoice.id}`);
    if (res.ok) {
      const data = await res.json();
      setInvoice(data);
    }
  }, [invoice.id]);

  async function markAsSent() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      if (!res.ok) throw new Error();
      toast({ message: 'Invoice marked as Sent', type: 'success' });
      await refresh();
      router.refresh();
    } catch {
      toast({ message: 'Failed to update invoice', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVoid() {
    setVoidLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ message: 'Invoice voided', type: 'success' });
      setShowVoidConfirm(false);
      await refresh();
      router.refresh();
    } catch {
      toast({ message: 'Failed to void invoice', type: 'error' });
    } finally {
      setVoidLoading(false);
    }
  }

  async function deleteLineItem(lineId: string) {
    if (!confirm('Remove this line item?')) return;
    const res = await fetch(`/api/invoices/${invoice.id}/line-items/${lineId}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ message: 'Line item removed', type: 'success' });
      await refresh();
    } else {
      toast({ message: 'Failed to remove line item', type: 'error' });
    }
  }

  async function saveNewLineItem() {
    if (!lineItemDraft.description.trim()) return;
    const res = await fetch(`/api/invoices/${invoice.id}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: lineItemDraft.description,
        quantity: parseFloat(lineItemDraft.quantity) || 1,
        unitPrice: parseFloat(lineItemDraft.unitPrice) || 0,
        lineType: lineItemDraft.lineType,
      }),
    });
    if (res.ok) {
      toast({ message: 'Line item added', type: 'success' });
      setAddingLineItem(false);
      setLineItemDraft({ description: '', quantity: '1', unitPrice: '', lineType: 'freight' });
      await refresh();
    } else {
      toast({ message: 'Failed to add line item', type: 'error' });
    }
  }

  function startEditLineItem(li: LineItem) {
    setEditingLineItemId(li.id);
    setLineItemEditDraft({
      description: li.description,
      quantity: String(li.quantity),
      unitPrice: String(li.unitPrice),
      lineType: li.lineType as typeof LINE_TYPES[number],
    });
  }

  async function saveEditLineItem(lineId: string) {
    const res = await fetch(`/api/invoices/${invoice.id}/line-items/${lineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: lineItemEditDraft.description,
        quantity: parseFloat(lineItemEditDraft.quantity) || 1,
        unitPrice: parseFloat(lineItemEditDraft.unitPrice) || 0,
        lineType: lineItemEditDraft.lineType,
      }),
    });
    if (res.ok) {
      toast({ message: 'Line item updated', type: 'success' });
      setEditingLineItemId(null);
      await refresh();
    } else {
      toast({ message: 'Failed to update line item', type: 'error' });
    }
  }

  async function deletePayment(paymentId: string) {
    if (!confirm('Delete this payment?')) return;
    const res = await fetch(`/api/invoices/${invoice.id}/payments/${paymentId}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ message: 'Payment deleted', type: 'success' });
      await refresh();
      router.refresh();
    } else {
      toast({ message: 'Failed to delete payment', type: 'error' });
    }
  }

  const isVoid = invoice.status === 'void';
  const canMarkSent = ['draft'].includes(invoice.status);
  const mailtoHref = invoice.customerEmail
    ? `mailto:${invoice.customerEmail}?subject=Invoice ${invoice.invoiceNumber}&body=Please find your invoice attached.`
    : '#';

  return (
    <>
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href={`/invoices/${invoice.id}/edit`}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white border border-[#1A2235] rounded-xl text-sm font-medium transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        {canMarkSent && (
          <button
            onClick={markAsSent}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Mark as Sent
          </button>
        )}
        {invoice.customerEmail && (
          <a
            href={mailtoHref}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white border border-[#1A2235] rounded-xl text-sm font-medium transition-colors"
          >
            <Mail className="h-4 w-4" />
            Send Invoice
          </a>
        )}
        {!isVoid && (
          <button
            onClick={() => setShowVoidConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Void
          </button>
        )}
      </div>

      {/* Line Items section */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Line Items</h2>
          {!isVoid && (
            <button
              onClick={() => { setAddingLineItem(true); setEditingLineItemId(null); }}
              disabled={addingLineItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00C650] hover:text-white hover:bg-[#00C650]/10 rounded-lg border border-[#00C650]/30 transition-colors disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </button>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1A2235]">
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5">Description</th>
              <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5 w-36">Type</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5 w-20">Qty</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5 w-32">Unit Price</th>
              <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5 w-32">Amount</th>
              {!isVoid && <th className="w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2235]">
            {invoice.lineItems.map((li) =>
              editingLineItemId === li.id ? (
                <tr key={li.id} className="bg-[#0C1528]">
                  <td className="px-5 py-2.5">
                    <input autoFocus type="text" value={lineItemEditDraft.description}
                      onChange={(e) => setLineItemEditDraft((d) => ({ ...d, description: e.target.value }))}
                      className={inputClass}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEditLineItem(li.id); if (e.key === 'Escape') setEditingLineItemId(null); }}
                    />
                  </td>
                  <td className="px-5 py-2.5">
                    <select value={lineItemEditDraft.lineType}
                      onChange={(e) => setLineItemEditDraft((d) => ({ ...d, lineType: e.target.value as typeof LINE_TYPES[number] }))}
                      className={inputClass}>
                      {LINE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-2.5">
                    <input type="number" step="0.01" value={lineItemEditDraft.quantity}
                      onChange={(e) => setLineItemEditDraft((d) => ({ ...d, quantity: e.target.value }))}
                      className={cn(inputClass, 'text-right')} />
                  </td>
                  <td className="px-5 py-2.5">
                    <input type="number" step="0.01" value={lineItemEditDraft.unitPrice}
                      onChange={(e) => setLineItemEditDraft((d) => ({ ...d, unitPrice: e.target.value }))}
                      className={cn(inputClass, 'text-right')} />
                  </td>
                  <td className="px-5 py-2.5 text-right text-sm text-white">
                    ${((parseFloat(lineItemEditDraft.quantity) || 1) * (parseFloat(lineItemEditDraft.unitPrice) || 0)).toFixed(2)}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => saveEditLineItem(li.id)} className="p-1.5 rounded-lg bg-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/30 transition-colors text-xs">✓</button>
                      <button onClick={() => setEditingLineItemId(null)} className="p-1.5 rounded-lg bg-[#8B95A5]/10 text-[#8B95A5] hover:bg-[#8B95A5]/20 transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={li.id} className="hover:bg-[#0C1528]/50 transition-colors group">
                  <td className="px-5 py-3 text-sm text-white">{li.description}</td>
                  <td className="px-5 py-3"><LineTypeBadge lineType={li.lineType} /></td>
                  <td className="px-5 py-3 text-sm text-[#8B95A5] text-right">{li.quantity}</td>
                  <td className="px-5 py-3 text-sm text-[#8B95A5] text-right">{formatCurrency(li.unitPrice)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-white text-right">{formatCurrency(li.amount)}</td>
                  {!isVoid && (
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditLineItem(li)} className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteLineItem(li.id)} className="p-1.5 rounded-lg text-[#8B95A5] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
            {addingLineItem && (
              <tr className="bg-[#0C1528]">
                <td className="px-5 py-2.5">
                  <input autoFocus type="text" value={lineItemDraft.description} placeholder="Description"
                    onChange={(e) => setLineItemDraft((d) => ({ ...d, description: e.target.value }))}
                    className={inputClass}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveNewLineItem(); if (e.key === 'Escape') { setAddingLineItem(false); } }}
                  />
                </td>
                <td className="px-5 py-2.5">
                  <select value={lineItemDraft.lineType}
                    onChange={(e) => setLineItemDraft((d) => ({ ...d, lineType: e.target.value as typeof LINE_TYPES[number] }))}
                    className={inputClass}>
                    {LINE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-5 py-2.5">
                  <input type="number" step="0.01" value={lineItemDraft.quantity}
                    onChange={(e) => setLineItemDraft((d) => ({ ...d, quantity: e.target.value }))}
                    className={cn(inputClass, 'text-right')} />
                </td>
                <td className="px-5 py-2.5">
                  <input type="number" step="0.01" value={lineItemDraft.unitPrice} placeholder="0.00"
                    onChange={(e) => setLineItemDraft((d) => ({ ...d, unitPrice: e.target.value }))}
                    className={cn(inputClass, 'text-right')} />
                </td>
                <td className="px-5 py-2.5 text-right text-sm text-white">
                  ${((parseFloat(lineItemDraft.quantity) || 1) * (parseFloat(lineItemDraft.unitPrice) || 0)).toFixed(2)}
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={saveNewLineItem} className="p-1.5 rounded-lg bg-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/30 transition-colors text-xs">✓</button>
                    <button onClick={() => setAddingLineItem(false)} className="p-1.5 rounded-lg bg-[#8B95A5]/10 text-[#8B95A5] hover:bg-[#8B95A5]/20 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-[#1A2235] px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#8B95A5]">Subtotal</span>
            <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#8B95A5]">Tax</span>
              <span className="text-white">{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-[#1A2235] pt-2">
            <span className="text-white">Total</span>
            <span className="text-white">{formatCurrency(invoice.total)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#8B95A5]">Amount Paid</span>
              <span className="text-[#00C650]">- {formatCurrency(invoice.amountPaid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-[#1A2235] pt-3">
            <span className="text-sm font-bold text-white uppercase tracking-wide">Balance Due</span>
            <span className={`text-2xl font-bold ${invoice.balanceDue <= 0 ? 'text-[#00C650]' : invoice.effectiveStatus === 'overdue' ? 'text-red-400' : 'text-yellow-400'}`}>
              {invoice.balanceDue <= 0 ? formatCurrency(0) : formatCurrency(invoice.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments Received */}
      <div className="rounded-2xl bg-[#080F1E] border border-[#1A2235] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
          <h2 className="text-sm font-semibold text-white">Payments Received</h2>
          {!isVoid && (
            <button
              onClick={() => { setEditingPayment(null); setShowPaymentModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#00C650] hover:bg-[#00B347] text-black font-semibold rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Payment
            </button>
          )}
        </div>
        {invoice.payments.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#8B95A5]">
            No payments recorded yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5">Date</th>
                <th className="text-right text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5">Amount</th>
                <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5">Method</th>
                <th className="text-left text-xs font-semibold text-[#8B95A5] uppercase tracking-wide px-5 py-2.5">Reference #</th>
                {!isVoid && <th className="w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2235]">
              {invoice.payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#0C1528]/50 transition-colors group">
                  <td className="px-5 py-3 text-sm text-[#8B95A5]">{formatDate(p.paymentDate)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-[#00C650] text-right">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-3 text-sm text-[#8B95A5]">{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</td>
                  <td className="px-5 py-3 text-sm text-[#8B95A5] font-mono">{p.referenceNumber ?? '—'}</td>
                  {!isVoid && (
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingPayment(p); setShowPaymentModal(true); }}
                          className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deletePayment(p.id)}
                          className="p-1.5 rounded-lg text-[#8B95A5] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          balanceDue={invoice.balanceDue}
          payment={editingPayment}
          onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }}
          onSaved={async () => {
            setShowPaymentModal(false);
            setEditingPayment(null);
            await refresh();
            router.refresh();
          }}
        />
      )}

      {/* Void Confirmation */}
      {showVoidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVoidConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Void Invoice?</h3>
            <p className="text-sm text-[#8B95A5] mb-6">
              This will mark <strong className="text-white">{invoice.invoiceNumber}</strong> as void. The record is preserved but the invoice is no longer active.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleVoid}
                disabled={voidLoading}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {voidLoading ? 'Voiding...' : 'Void Invoice'}
              </button>
              <button
                onClick={() => setShowVoidConfirm(false)}
                className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
