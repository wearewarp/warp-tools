'use client';

import { useState, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { UploadDropZone } from './UploadDropZone';
import { UploadProgress } from './UploadProgress';
import { formatFileSize } from '@/lib/utils';
import { useToast } from './Toast';
import type { DocType } from '@/db/schema';

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

function detectDocType(filename: string): DocType {
  const lower = filename.toLowerCase();
  if (lower.includes('bol') || lower.includes('bill_of_lading') || lower.includes('billoflading')) return 'bol';
  if (lower.includes('pod') || lower.includes('proof_of_delivery') || lower.includes('proofofdelivery')) return 'pod';
  if (lower.includes('rate') || lower.includes('ratecon') || lower.includes('rate_con')) return 'rate_confirmation';
  if (lower.includes('invoice') || lower.includes('inv_')) return 'invoice';
  if (lower.includes('insurance') || lower.includes('coi') || lower.includes('cert')) return 'insurance_cert';
  if (lower.includes('authority')) return 'authority_letter';
  if (lower.includes('customs') || lower.includes('declaration')) return 'customs_declaration';
  if (lower.includes('weight') || lower.includes('scale')) return 'weight_certificate';
  if (lower.includes('lumper')) return 'lumper_receipt';
  return 'other';
}

interface FileEntry {
  id: string;
  file: File;
  docType: DocType;
  loadRef: string;
  carrierName: string;
  customerName: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  uploadedId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadModal({ open, onClose }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback((incoming: File[]) => {
    const newEntries: FileEntry[] = incoming.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      docType: detectDocType(file.name),
      loadRef: '',
      carrierName: '',
      customerName: '',
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const updateEntry = useCallback(
    (id: string, updates: Partial<Omit<FileEntry, 'id' | 'file'>>) => {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const uploadAll = useCallback(async () => {
    if (uploading) return;
    setUploading(true);
    setAllDone(false);

    let successCount = 0;

    for (const entry of files) {
      if (entry.status === 'done') continue;

      updateEntry(entry.id, { status: 'uploading', progress: 10 });

      const fd = new FormData();
      fd.append('file', entry.file);
      fd.append('doc_type', entry.docType);
      if (entry.loadRef) fd.append('load_ref', entry.loadRef);
      if (entry.carrierName) fd.append('carrier_name', entry.carrierName);
      if (entry.customerName) fd.append('customer_name', entry.customerName);

      try {
        updateEntry(entry.id, { progress: 50 });
        const res = await fetch('/api/documents', { method: 'POST', body: fd });
        if (!res.ok) {
          const data = await res.json();
          updateEntry(entry.id, { status: 'error', errorMessage: data.error ?? 'Upload failed', progress: 0 });
        } else {
          const doc = await res.json();
          updateEntry(entry.id, { status: 'done', progress: 100, uploadedId: doc.id });
          successCount++;
        }
      } catch {
        updateEntry(entry.id, { status: 'error', errorMessage: 'Network error', progress: 0 });
      }
    }

    setUploading(false);
    setAllDone(true);

    if (successCount > 0) {
      toast({ message: `${successCount} file${successCount !== 1 ? 's' : ''} uploaded`, type: 'success' });
    }
  }, [files, uploading, updateEntry, toast]);

  const handleClose = useCallback(() => {
    setFiles([]);
    setAllDone(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  const pendingCount = files.filter((f) => f.status !== 'done').length;
  const doneFiles = files.filter((f) => f.status === 'done');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <UploadDropZone onFiles={handleFiles} />

          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[#1A2235] bg-[#0C1528] p-4 space-y-3"
                >
                  {/* Progress */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <UploadProgress
                        filename={entry.file.name}
                        progress={entry.progress}
                        status={entry.status}
                        errorMessage={entry.errorMessage}
                      />
                      <p className="text-[10px] text-[#8B95A5] mt-0.5 pl-6">
                        {formatFileSize(entry.file.size)}
                      </p>
                    </div>
                    {entry.status !== 'done' && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="mt-0.5 text-[#8B95A5] hover:text-red-400 transition-colors"
                        aria-label="Remove file"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {entry.uploadedId && (
                      <a
                        href={`/documents/${entry.uploadedId}`}
                        className="mt-0.5 text-[#00C650] hover:text-[#00C650]/80 transition-colors"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="View uploaded document"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {/* Metadata fields */}
                  {entry.status !== 'done' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs text-[#8B95A5] mb-1">Document Type</label>
                        <select
                          value={entry.docType}
                          onChange={(e) => updateEntry(entry.id, { docType: e.target.value as DocType })}
                          disabled={uploading}
                          className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00C650]/50 disabled:opacity-60"
                        >
                          {DOC_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#8B95A5] mb-1">Load Ref</label>
                        <input
                          type="text"
                          placeholder="LD-10041"
                          value={entry.loadRef}
                          onChange={(e) => updateEntry(entry.id, { loadRef: e.target.value })}
                          disabled={uploading}
                          className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8B95A5] mb-1">Carrier</label>
                        <input
                          type="text"
                          placeholder="Carrier name"
                          value={entry.carrierName}
                          onChange={(e) => updateEntry(entry.id, { carrierName: e.target.value })}
                          disabled={uploading}
                          className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50 disabled:opacity-60"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-[#8B95A5] mb-1">Customer</label>
                        <input
                          type="text"
                          placeholder="Customer name"
                          value={entry.customerName}
                          onChange={(e) => updateEntry(entry.id, { customerName: e.target.value })}
                          disabled={uploading}
                          className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Success state */}
          {allDone && doneFiles.length > 0 && (
            <div className="rounded-xl border border-[#00C650]/20 bg-[#00C650]/5 p-4">
              <p className="text-sm font-medium text-[#00C650] mb-2">
                {doneFiles.length} document{doneFiles.length !== 1 ? 's' : ''} uploaded
              </p>
              <div className="space-y-1">
                {doneFiles.map((f) => (
                  <a
                    key={f.id}
                    href={`/documents/${f.uploadedId}`}
                    className="flex items-center gap-1.5 text-xs text-[#8B95A5] hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 text-[#00C650]" />
                    {f.file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {files.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1A2235]">
            <span className="text-sm text-[#8B95A5]">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
              {pendingCount < files.length && ` · ${files.length - pendingCount} done`}
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-[#2A3245] px-4 py-2 text-sm text-[#8B95A5] hover:text-white hover:border-[#4B5563] transition-colors"
              >
                {allDone ? 'Close' : 'Cancel'}
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  disabled={uploading}
                  className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading…' : `Upload ${pendingCount > 1 ? `All ${pendingCount}` : '1 File'}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
