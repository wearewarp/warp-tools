'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from './Toast';
import type { Document, DocType } from '@/db/schema';

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: 'bol', label: 'Bill of Lading (BOL)' },
  { value: 'pod', label: 'Proof of Delivery (POD)' },
  { value: 'rate_confirmation', label: 'Rate Confirmation' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'insurance_cert', label: 'Insurance Certificate' },
  { value: 'authority_letter', label: 'Authority Letter' },
  { value: 'customs_declaration', label: 'Customs Declaration' },
  { value: 'weight_certificate', label: 'Weight Certificate' },
  { value: 'lumper_receipt', label: 'Lumper Receipt' },
  { value: 'other', label: 'Other' },
];

interface Props {
  doc: Document;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Document) => void;
}

export function EditDocumentModal({ doc, open, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    docType: doc.docType,
    loadRef: doc.loadRef ?? '',
    carrierName: doc.carrierName ?? '',
    customerName: doc.customerName ?? '',
    documentDate: doc.documentDate ?? '',
    expiryDate: doc.expiryDate ?? '',
    tags: (() => {
      try { return (JSON.parse(doc.tags ?? '[]') as string[]).join(', '); }
      catch { return ''; }
    })(),
    notes: doc.notes ?? '',
  });

  // Sync when doc changes
  useEffect(() => {
    setForm({
      docType: doc.docType,
      loadRef: doc.loadRef ?? '',
      carrierName: doc.carrierName ?? '',
      customerName: doc.customerName ?? '',
      documentDate: doc.documentDate ?? '',
      expiryDate: doc.expiryDate ?? '',
      tags: (() => {
        try { return (JSON.parse(doc.tags ?? '[]') as string[]).join(', '); }
        catch { return ''; }
      })(),
      notes: doc.notes ?? '',
    });
  }, [doc]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = JSON.stringify(
        form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      );

      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: form.docType,
          loadRef: form.loadRef || null,
          carrierName: form.carrierName || null,
          customerName: form.customerName || null,
          documentDate: form.documentDate || null,
          expiryDate: form.expiryDate || null,
          tags,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Save failed', type: 'error' });
        return;
      }

      const updated = await res.json();
      toast({ message: 'Document updated', type: 'success' });
      onSaved(updated);
      onClose();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-lg font-semibold text-white">Edit Document</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Doc type */}
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Document Type</label>
            <select
              value={form.docType}
              onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value as DocType }))}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00C650]/50"
            >
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Load Ref */}
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Load Reference</label>
            <input
              type="text"
              placeholder="LD-10041"
              value={form.loadRef}
              onChange={(e) => setForm((f) => ({ ...f, loadRef: e.target.value }))}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          {/* Carrier + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Carrier</label>
              <input
                type="text"
                placeholder="Carrier name"
                value={form.carrierName}
                onChange={(e) => setForm((f) => ({ ...f, carrierName: e.target.value }))}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Customer</label>
              <input
                type="text"
                placeholder="Customer name"
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
          </div>

          {/* Document date + Expiry date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Document Date</label>
              <input
                type="date"
                value={form.documentDate}
                onChange={(e) => setForm((f) => ({ ...f, documentDate: e.target.value }))}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00C650]/50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Tags</label>
            <input
              type="text"
              placeholder="pickup, signed, urgent (comma-separated)"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Notes</label>
            <textarea
              placeholder="Any notes about this document…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1A2235]">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#2A3245] px-4 py-2 text-sm text-[#8B95A5] hover:text-white hover:border-[#4B5563] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
