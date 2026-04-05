'use client';

import { Download, FileText } from 'lucide-react';

interface Document {
  id: string;
  docType: string;
  filename: string;
  originalName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
}

interface DocumentGridProps {
  documents: Document[];
  shipmentId: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  bol: 'Bill of Lading',
  pod: 'Proof of Delivery',
  invoice: 'Invoice',
  rate_confirmation: 'Rate Confirmation',
  customs: 'Customs',
  weight_cert: 'Weight Certificate',
  other: 'Other',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  bol: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  pod: 'text-green-400 bg-green-400/10 border-green-400/20',
  invoice: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  rate_confirmation: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  customs: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  weight_cert: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  other: 'text-[#8B95A5] bg-[#8B95A5]/10 border-[#8B95A5]/20',
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DocumentGrid({ documents, shipmentId }: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-[#8B95A5] text-sm">
        No documents available yet. Documents will appear here when shared by your broker.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => {
        const typeColor = DOC_TYPE_COLORS[doc.docType] ?? DOC_TYPE_COLORS.other;
        const typeLabel = DOC_TYPE_LABELS[doc.docType] ?? doc.docType;

        return (
          <div
            key={doc.id}
            className="rounded-lg border border-[#1A2235] bg-[#040810] p-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#080F1E] border border-[#1A2235] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#8B95A5]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor} mb-1`}>
                  {typeLabel}
                </span>
                <p className="text-xs text-[#8B95A5] truncate" title={doc.originalName}>
                  {doc.originalName}
                </p>
                <p className="text-xs text-[#8B95A5] mt-0.5">
                  {formatDate(doc.uploadedAt)}
                  {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                </p>
              </div>
            </div>
            <a
              href={`/api/portal/shipments/${shipmentId}/documents/${doc.id}/download`}
              download={doc.originalName}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/20 transition-colors text-xs font-medium py-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </div>
        );
      })}
    </div>
  );
}
