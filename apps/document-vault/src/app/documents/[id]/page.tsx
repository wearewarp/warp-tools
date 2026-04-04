'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Download, Edit2, Archive, ExternalLink,
  Calendar, User, FileText, Tag, Hash, Truck, Building2,
  AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';
import { DocumentTypeBadge } from '@/components/DocumentTypeBadge';
import { FilePreview } from '@/components/FilePreview';
import { EditDocumentModal } from '@/components/EditDocumentModal';
import { DocumentCard } from '@/components/DocumentCard';
import { useToast } from '@/components/Toast';
import { formatDate, formatFileSize, daysUntil, cn } from '@/lib/utils';
import type { Document } from '@/db/schema';

interface DocWithRelated extends Document {
  related: Document[];
}

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Expired {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} ago
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-yellow-400">
        <Clock className="h-3.5 w-3.5" />
        Expires in {days} day{days !== 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400">
      <CheckCircle className="h-3.5 w-3.5" />
      Expires in {days} day{days !== 1 ? 's' : ''}
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#1A2235] px-2.5 py-0.5 text-xs text-[#8B95A5]">
      {label}
    </span>
  );
}

interface MetaRowProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}

function MetaRow({ icon: Icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#1A2235]">
        <Icon className="h-3.5 w-3.5 text-[#8B95A5]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-[#8B95A5] uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-white">{children}</div>
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [doc, setDoc] = useState<DocWithRelated | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/documents');
          return;
        }
        throw new Error('Failed to load');
      }
      const data = await res.json();
      setDoc(data);
    } catch {
      toast({ message: 'Failed to load document', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const handleArchive = async () => {
    if (!doc) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ message: 'Document archived', type: 'success' });
        router.push('/documents');
      } else {
        toast({ message: 'Archive failed', type: 'error' });
      }
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setArchiving(false);
      setConfirmArchive(false);
    }
  };

  const parsedTags = (() => {
    try { return JSON.parse(doc?.tags ?? '[]') as string[]; }
    catch { return []; }
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 rounded-full border-2 border-[#00C650] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#1A2235] bg-[#040810]">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/documents" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] transition-colors flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white truncate">{doc.originalName}</h1>
            <p className="text-xs text-[#8B95A5]">
              Uploaded {formatDate(doc.createdAt)}
              {doc.uploadedBy && ` by ${doc.uploadedBy}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/api/documents/${id}/file`}
            download={doc.originalName}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A2235] px-3 py-2 text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#1A2235] px-3 py-2 text-sm text-[#8B95A5] hover:text-white hover:border-[#2A3245] transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          {doc.status === 'active' && !confirmArchive && (
            <button
              onClick={() => setConfirmArchive(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#1A2235] px-3 py-2 text-sm text-[#8B95A5] hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}
          {confirmArchive && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Archive this document?</span>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                {archiving ? 'Archiving…' : 'Yes, archive'}
              </button>
              <button
                onClick={() => setConfirmArchive(false)}
                className="rounded-lg border border-[#1A2235] px-3 py-1.5 text-xs text-[#8B95A5] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: 2 column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Preview */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
          <FilePreview
            documentId={id}
            mimeType={doc.mimeType}
            originalName={doc.originalName}
            className="flex-1 min-h-[400px]"
          />

          {/* Related documents */}
          {doc.related && doc.related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#8B95A5]" />
                Related Documents
                <span className="text-xs font-normal text-[#8B95A5]">
                  — {doc.loadRef}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {doc.related.map((rel) => (
                  <DocumentCard key={rel.id} doc={rel} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-[#1A2235] bg-[#080F1E] overflow-y-auto p-5 space-y-5">
          {/* Type */}
          <div>
            <p className="text-[10px] font-medium text-[#8B95A5] uppercase tracking-wider mb-2">Document Type</p>
            <DocumentTypeBadge docType={doc.docType} size="lg" />
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-medium text-[#8B95A5] uppercase tracking-wider mb-2">Status</p>
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              doc.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-slate-400/10'
            )}>
              {doc.status === 'active' ? 'Active' : 'Archived'}
            </span>
          </div>

          <div className="border-t border-[#1A2235]" />

          {/* File info */}
          <div className="space-y-3">
            <MetaRow icon={FileText} label="Filename">
              <span className="text-[#8B95A5] text-xs break-all">{doc.filename}</span>
            </MetaRow>
            <MetaRow icon={FileText} label="Original Name">
              <span className="break-all">{doc.originalName}</span>
            </MetaRow>
            <MetaRow icon={FileText} label="File Size">
              {formatFileSize(doc.fileSize)}
            </MetaRow>
            <MetaRow icon={Calendar} label="Upload Date">
              {formatDate(doc.createdAt)}
            </MetaRow>
          </div>

          <div className="border-t border-[#1A2235]" />

          {/* Document dates */}
          <div className="space-y-3">
            {doc.documentDate && (
              <MetaRow icon={Calendar} label="Document Date">
                {formatDate(doc.documentDate)}
              </MetaRow>
            )}
            {doc.expiryDate && (
              <MetaRow icon={Clock} label="Expiry Date">
                <div className="space-y-1">
                  <p>{formatDate(doc.expiryDate)}</p>
                  <ExpiryBadge expiryDate={doc.expiryDate} />
                </div>
              </MetaRow>
            )}
          </div>

          {/* Load ref */}
          {doc.loadRef && (
            <>
              <div className="border-t border-[#1A2235]" />
              <MetaRow icon={Hash} label="Load Reference">
                <Link href={`/loads/${doc.loadRef}`} className="text-[#4B8EE8] hover:underline flex items-center gap-1">
                  {doc.loadRef}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </MetaRow>
            </>
          )}

          {/* Carrier / Customer */}
          {(doc.carrierName || doc.customerName) && (
            <>
              <div className="border-t border-[#1A2235]" />
              <div className="space-y-3">
                {doc.carrierName && (
                  <MetaRow icon={Truck} label="Carrier">
                    {doc.carrierId ? (
                      <Link href={`#carrier-${doc.carrierId}`} className="text-[#00C650] hover:underline">
                        {doc.carrierName}
                      </Link>
                    ) : (
                      <span>{doc.carrierName}</span>
                    )}
                  </MetaRow>
                )}
                {doc.customerName && (
                  <MetaRow icon={Building2} label="Customer">
                    <span>{doc.customerName}</span>
                  </MetaRow>
                )}
              </div>
            </>
          )}

          {/* Tags */}
          {parsedTags.length > 0 && (
            <>
              <div className="border-t border-[#1A2235]" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-3.5 w-3.5 text-[#8B95A5]" />
                  <p className="text-[10px] font-medium text-[#8B95A5] uppercase tracking-wider">Tags</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedTags.map((tag, i) => (
                    <TagChip key={i} label={tag} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {doc.notes && (
            <>
              <div className="border-t border-[#1A2235]" />
              <div>
                <p className="text-[10px] font-medium text-[#8B95A5] uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-[#8B95A5] leading-relaxed whitespace-pre-wrap">{doc.notes}</p>
              </div>
            </>
          )}

          {/* Uploaded by */}
          {doc.uploadedBy && (
            <>
              <div className="border-t border-[#1A2235]" />
              <MetaRow icon={User} label="Uploaded By">
                {doc.uploadedBy}
              </MetaRow>
            </>
          )}

          {/* Edit button at bottom */}
          <div className="border-t border-[#1A2235] pt-3">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2A3245] py-2.5 text-sm text-[#8B95A5] hover:text-white hover:border-[#4B5563] transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit Metadata
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {doc && (
        <EditDocumentModal
          doc={doc}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setDoc((prev) => prev ? { ...prev, ...updated } : prev)}
        />
      )}
    </div>
  );
}
