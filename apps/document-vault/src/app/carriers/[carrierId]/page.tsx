export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documents } from '@/db/schema';
import Link from 'next/link';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { DocTypeIcon } from '@/components/DocTypeIcon';
import { formatDate, formatFileSize, getDocTypeLabel, getDocTypeColor, daysUntil } from '@/lib/utils';
import type { DocType, Document } from '@/db/schema';

interface Props {
  params: Promise<{ carrierId: string }>;
}

function getExpiryBadge(expiryDate: string | null) {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  if (days === null) return null;
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, className: 'text-red-400 bg-red-400/10' };
  if (days <= 30) return { label: `Expires in ${days}d`, className: 'text-yellow-400 bg-yellow-400/10' };
  return { label: `Valid ${days}d`, className: 'text-green-400 bg-green-400/10' };
}

// Group types for display order
const TYPE_GROUPS: { label: string; types: DocType[] }[] = [
  { label: 'Insurance & Compliance', types: ['insurance_cert', 'authority_letter'] },
  { label: 'Rate Confirmations', types: ['rate_confirmation'] },
  { label: 'Shipping Documents', types: ['bol', 'pod', 'weight_certificate', 'lumper_receipt'] },
  { label: 'Financial', types: ['invoice'] },
  { label: 'Other', types: ['customs_declaration', 'other'] },
];

async function getCarrierData(carrierId: string) {
  const allDocs = await db.select().from(documents);
  const carrierDocs = allDocs.filter(
    (d) => d.carrierId === carrierId && d.status === 'active'
  );
  const carrierName = carrierDocs[0]?.carrierName ?? carrierId;

  // Group by doc type
  const byType = new Map<string, Document[]>();
  for (const doc of carrierDocs) {
    if (!byType.has(doc.docType)) byType.set(doc.docType, []);
    byType.get(doc.docType)!.push(doc);
  }

  // Build grouped sections
  const sections = TYPE_GROUPS
    .map((group) => {
      const docs = group.types.flatMap((t) => byType.get(t) ?? []);
      return { label: group.label, docs };
    })
    .filter((s) => s.docs.length > 0);

  return { carrierName, carrierDocs, sections };
}

export default async function CarrierDetailPage({ params }: Props) {
  const { carrierId } = await params;
  const decoded = decodeURIComponent(carrierId);
  const { carrierName, carrierDocs, sections } = await getCarrierData(decoded);

  const expiredCount = carrierDocs.filter((d) => {
    const days = daysUntil(d.expiryDate);
    return days !== null && days < 0;
  }).length;
  const expiringCount = carrierDocs.filter((d) => {
    const days = daysUntil(d.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/carriers" className="inline-flex items-center gap-1.5 text-sm text-[#8B95A5] hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Carriers
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{carrierName}</h1>
          <p className="text-sm text-[#8B95A5] mt-1">{carrierDocs.length} document{carrierDocs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {expiredCount} expired
            </span>
          )}
          {expiringCount > 0 && (
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" /> {expiringCount} expiring
            </span>
          )}
          {expiredCount === 0 && expiringCount === 0 && carrierDocs.length > 0 && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> All current
            </span>
          )}
        </div>
      </div>

      {carrierDocs.length === 0 ? (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <p className="text-[#8B95A5]">No documents for this carrier.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.label}>
              <h2 className="text-sm font-semibold text-[#8B95A5] uppercase tracking-wider mb-3">{section.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.docs.map((doc) => {
                  const badge = getExpiryBadge(doc.expiryDate);
                  return (
                    <Link key={doc.id} href={`/documents/${doc.id}`}
                      className="group flex items-start gap-3 rounded-xl border border-[#1A2235] bg-[#080F1E] hover:border-[#242E44] hover:bg-[#0C1528] transition-all p-4">
                      <DocTypeIcon docType={doc.docType as DocType} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">{doc.originalName}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${getDocTypeColor(doc.docType as DocType)}`}>
                            {getDocTypeLabel(doc.docType as DocType)}
                          </span>
                          {badge && (
                            <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-[#8B95A5]">{formatFileSize(doc.fileSize)}</span>
                          <span className="text-xs text-[#4B6080]">·</span>
                          <span className="text-xs text-[#8B95A5]">{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href={`/documents?upload=true&carrierId=${encodeURIComponent(decoded)}&carrierName=${encodeURIComponent(carrierName)}`}
          className="inline-flex items-center gap-2 bg-[#00C650] hover:bg-[#00B045] text-black font-medium text-sm px-4 py-2.5 rounded-lg transition-colors">
          <Upload className="h-4 w-4" />
          Upload Document for {carrierName}
        </Link>
      </div>
    </div>
  );
}
