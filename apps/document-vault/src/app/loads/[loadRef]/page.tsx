export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documentRequirements, documents } from '@/db/schema';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { DocChecklist } from '@/components/DocChecklist';
import { DocTypeIcon } from '@/components/DocTypeIcon';
import { CompletenessBar } from '@/components/CompletenessBar';
import { formatDate, formatFileSize, getDocTypeLabel, getDocTypeColor } from '@/lib/utils';
import type { DocType } from '@/db/schema';

interface Props {
  params: Promise<{ loadRef: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  booked: 'text-blue-400 bg-blue-400/10',
  in_transit: 'text-yellow-400 bg-yellow-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  invoiced: 'text-purple-400 bg-purple-400/10',
  closed: 'text-slate-400 bg-slate-400/10',
};

async function getLoadData(loadRef: string) {
  const [allReqs, loadDocs] = await Promise.all([
    db.select().from(documentRequirements),
    db.select().from(documents),
  ]);

  const reqs = allReqs.filter((r) => r.loadRef === loadRef);
  const docs = loadDocs.filter((d) => d.loadRef === loadRef);

  // Build doc map: id -> doc
  const docMap = Object.fromEntries(loadDocs.map((d) => [d.id, d]));

  const loadStatus = reqs.length > 0 ? reqs[reqs.length - 1].loadStatus : null;
  const totalRequired = reqs.length;
  const totalFulfilled = reqs.filter((r) => r.fulfilled).length;

  const checklistItems = reqs.map((req) => {
    const doc = req.documentId ? docMap[req.documentId] : null;
    return {
      requiredType: req.requiredType,
      fulfilled: req.fulfilled,
      documentId: req.documentId,
      documentName: doc?.originalName ?? null,
    };
  });

  return {
    loadRef,
    loadStatus,
    checklistItems,
    docs,
    totalRequired,
    totalFulfilled,
  };
}

export default async function LoadDetailPage({ params }: Props) {
  const { loadRef } = await params;
  const decodedRef = decodeURIComponent(loadRef);
  const { loadStatus, checklistItems, docs, totalRequired, totalFulfilled } = await getLoadData(decodedRef);

  const missingTypes = checklistItems.filter((i) => !i.fulfilled).map((i) => i.requiredType);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/loads"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Loads
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white font-mono">{decodedRef}</h1>
          {loadStatus && (
            <div className="mt-2">
              <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[loadStatus] ?? 'text-slate-400 bg-slate-400/10'}`}>
                {STATUS_LABELS[loadStatus] ?? loadStatus}
              </span>
            </div>
          )}
        </div>

        {/* Completeness summary */}
        {totalRequired > 0 && (
          <div className="text-right">
            <div className="text-sm text-[#8B95A5] mb-1">
              {totalFulfilled}/{totalRequired} docs
            </div>
            <div className="w-32">
              <CompletenessBar fulfilled={totalFulfilled} total={totalRequired} />
            </div>
          </div>
        )}
      </div>

      {/* Document Checklist */}
      {checklistItems.length > 0 ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Required Documents</h2>
            {missingTypes.length > 0 && (
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                {missingTypes.length} missing
              </span>
            )}
            {missingTypes.length === 0 && (
              <span className="text-xs text-[#00C650] bg-[#00C650]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                All complete
              </span>
            )}
          </div>
          <DocChecklist items={checklistItems as Parameters<typeof DocChecklist>[0]['items']} loadRef={decodedRef} />

          {/* Upload missing button */}
          {missingTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {missingTypes.map((type) => (
                <Link
                  key={type}
                  href={`/documents?upload=true&loadRef=${encodeURIComponent(decodedRef)}&docType=${type}`}
                  className="inline-flex items-center gap-1.5 text-sm bg-[#1A2235] hover:bg-[#242E44] text-white px-3 py-2 rounded-lg transition-colors border border-[#242E44]"
                >
                  <Upload className="h-3.5 w-3.5 text-[#00C650]" />
                  Upload {getDocTypeLabel(type as DocType)}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6 mb-8 text-center">
          <p className="text-[#8B95A5] text-sm">No document requirements tracked for this load.</p>
        </div>
      )}

      {/* All Documents for this Load */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">
            All Documents
            {docs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[#8B95A5]">({docs.length})</span>
            )}
          </h2>
          <Link
            href={`/documents?upload=true&loadRef=${encodeURIComponent(decodedRef)}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#4B8EE8] hover:text-blue-300 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Link>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-8 text-center">
            <p className="text-[#8B95A5] text-sm">No documents uploaded for this load yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group flex items-start gap-3 rounded-xl border border-[#1A2235] bg-[#080F1E] hover:border-[#242E44] hover:bg-[#0C1528] transition-all p-4"
              >
                <DocTypeIcon docType={doc.docType as DocType} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                    {doc.originalName}
                  </div>
                  <div className={`inline-flex items-center mt-1 text-xs px-2 py-0.5 rounded-full ${getDocTypeColor(doc.docType as DocType)}`}>
                    {getDocTypeLabel(doc.docType as DocType)}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-[#8B95A5]">{formatFileSize(doc.fileSize)}</span>
                    <span className="text-xs text-[#4B6080]">·</span>
                    <span className="text-xs text-[#8B95A5]">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
