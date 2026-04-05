'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

const DOC_TYPES = [
  { value: 'bol', label: 'BOL' },
  { value: 'pod', label: 'POD' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'rate_confirmation', label: 'Rate Confirmation' },
  { value: 'customs', label: 'Customs' },
  { value: 'weight_cert', label: 'Weight Cert' },
  { value: 'other', label: 'Other' },
];

interface UploadDocumentModalProps {
  open: boolean;
  shipmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadDocumentModal({ open, shipmentId, onClose, onSuccess }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('bol');
  const [isVisibleToCustomer, setIsVisibleToCustomer] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      formData.append('isVisibleToCustomer', String(isVisibleToCustomer));
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await fetch(`/api/admin/shipments/${shipmentId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        setNotes('');
        onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Upload Document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[#00C650] bg-[#00C650]/5' : 'border-[#1A2235] hover:border-[#00C650]/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            <Upload className="w-6 h-6 text-[#8B95A5] mx-auto mb-2" />
            {file ? (
              <p className="text-sm text-slate-200">{file.name}</p>
            ) : (
              <p className="text-sm text-[#8B95A5]">Drop file here or click to browse</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisibleToCustomer}
              onChange={(e) => setIsVisibleToCustomer(e.target.checked)}
              className="rounded border-[#1A2235] bg-[#040810] text-[#00C650] focus:ring-[#00C650]"
            />
            Visible to customer
          </label>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-slate-200 focus:border-[#00C650] outline-none resize-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#080F1E] border border-[#1A2235] text-slate-200 hover:bg-[#0C1528]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#00C650] text-white hover:bg-[#00C650]/90 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
