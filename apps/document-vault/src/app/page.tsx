export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documents, documentRequirements } from '@/db/schema';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Files,
  HardDrive,
  AlertCircle,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { formatFileSize, formatDate, getDocTypeLabel, getDocTypeColor } from '@/lib/utils';
import { DocTypeIcon } from '@/components/DocTypeIcon';
import { UploadDropZone } from '@/components/UploadDropZone';
import type { DocType } from '@/db/schema';

async function getDashboardData() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [allDocs, allReqs] = await Promise.all([
    db.select().from(documents),
    db.select().from(documentRequirements),
  ]);

  const totalDocuments = allDocs.length;
  const documentsThisMonth = allDocs.filter((d) => d.createdAt >= firstOfMonth).length;
  const totalStorageBytes = allDocs.reduce((sum, d) => sum + d.fileSize, 0);

  // Missing docs
  const missingReqs = allReqs.filter((r) => !r.fulfilled);
  const missingByType: Record<string, number> = { bol: 0, pod: 0, rate_confirmation: 0, invoice: 0 };
  for (const req of missingReqs) {
    if (req.requiredType in missingByType) missingByType[req.requiredType]++;
  }
  const loadsWithMissing = new Set(missingReqs.map((r) => r.loadRef)).size;

  // Expiring / expired
  const docsWithExpiry = allDocs.filter((d) => d.expiryDate != null);
  const expiringDocs = docsWithExpiry.filter(
    (d) => d.expiryDate! >= today && d.expiryDate! <= in30Days
  );
  const expiredDocs = docsWithExpiry.filter((d) => d.expiryDate! < today);

  // Recent uploads
  const recentUploads = [...allDocs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  return {
    totalDocuments,
    documentsThisMonth,
    totalStorageBytes,
    loadsWithMissing,
    missingByType,
    expiringDocs,
    expiredDocs,
    recentUploads,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const {
    totalDocuments,
    documentsThisMonth,
    totalStorageBytes,
    loadsWithMissing,
    missingByType,
    expiringDocs,
    expiredDocs,
    recentUploads,
  } = data;

  const totalExpiryAlerts = expiringDocs.length + expiredDocs.length;

  // Build missing summary text
  const missingParts: string[] = [];
  if (missingByType.pod > 0) missingParts.push(`${missingByType.pod} missing POD${missingByType.pod !== 1 ? 's' : ''}`);
  if (missingByType.bol > 0) missingParts.push(`${missingByType.bol} missing BOL${missingByType.bol !== 1 ? 's' : ''}`);
  if (missingByType.rate_confirmation > 0) missingParts.push(`${missingByType.rate_confirmation} missing Rate Con${missingByType.rate_confirmation !== 1 ? 's' : ''}`);
  if (missingByType.invoice > 0) missingParts.push(`${missingByType.invoice} missing Invoice${missingByType.invoice !== 1 ? 's' : ''}`);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#8B95A5]">Document Vault — freight document management</p>
      </div>

      {/* Upload Drop Zone */}
      <UploadDropZone />

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Missing Documents Alert */}
        {loadsWithMissing > 0 && (
          <Link href="/loads?missing=true" className="group block">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {loadsWithMissing} load{loadsWithMissing !== 1 ? 's' : ''} missing required documents
                    </h3>
                    <ArrowRight className="h-4 w-4 text-red-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </div>
                  {missingParts.length > 0 && (
                    <p className="mt-1 text-sm text-red-300/80">
                      {missingParts.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Expiring Documents Alert */}
        {totalExpiryAlerts > 0 && (
          <Link href="/documents?expiring=true" className="group block">
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15 flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {expiredDocs.length > 0 && (
                        <span className="text-red-400">{expiredDocs.length} expired</span>
                      )}
                      {expiredDocs.length > 0 && expiringDocs.length > 0 && <span className="text-[#8B95A5]">, </span>}
                      {expiringDocs.length > 0 && (
                        <span className="text-yellow-400">{expiringDocs.length} expiring soon</span>
                      )}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-yellow-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {[...expiredDocs, ...expiringDocs].slice(0, 3).map((doc) => (
                      <span
                        key={doc.id}
                        className="text-xs text-yellow-300/70 bg-yellow-500/10 px-2 py-0.5 rounded-full"
                      >
                        {doc.carrierName ?? 'Unknown'} · {getDocTypeLabel(doc.docType as DocType)}
                      </span>
                    ))}
                    {totalExpiryAlerts > 3 && (
                      <span className="text-xs text-[#8B95A5]">+{totalExpiryAlerts - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Total Documents */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Files className="h-4 w-4 text-[#4B8EE8]" />
            <span className="text-xs text-[#8B95A5] uppercase tracking-wide">Total Documents</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalDocuments}</div>
        </div>

        {/* This Month */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="h-4 w-4 text-[#00C650]" />
            <span className="text-xs text-[#8B95A5] uppercase tracking-wide">This Month</span>
          </div>
          <div className="text-2xl font-bold text-white">{documentsThisMonth}</div>
          <div className="text-xs text-[#8B95A5] mt-0.5">uploaded</div>
        </div>

        {/* Storage Used */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-[#8B95A5] uppercase tracking-wide">Storage Used</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatFileSize(totalStorageBytes)}</div>
        </div>

        {/* Missing Documents */}
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-4 w-4 ${loadsWithMissing > 0 ? 'text-red-400' : 'text-[#8B95A5]'}`} />
            <span className="text-xs text-[#8B95A5] uppercase tracking-wide">Missing Docs</span>
          </div>
          <div className={`text-2xl font-bold ${loadsWithMissing > 0 ? 'text-red-400' : 'text-white'}`}>
            {loadsWithMissing}
          </div>
          <div className="text-xs text-[#8B95A5] mt-0.5">loads affected</div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Uploads</h2>
          <Link
            href="/documents"
            className="flex items-center gap-1 text-sm text-[#4B8EE8] hover:text-blue-300 transition-colors"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentUploads.length === 0 ? (
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
            <Files className="h-10 w-10 text-[#1A2235] mx-auto mb-3" />
            <p className="text-[#8B95A5]">No documents yet. Upload your first document above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recentUploads.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group rounded-xl border border-[#1A2235] bg-[#080F1E] hover:border-[#242E44] hover:bg-[#0C1528] transition-all p-4"
              >
                <div className="flex items-start gap-3">
                  <DocTypeIcon docType={doc.docType as DocType} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                      {doc.originalName}
                    </div>
                    <div className={`inline-flex items-center mt-1 text-xs px-2 py-0.5 rounded-full ${getDocTypeColor(doc.docType as DocType)}`}>
                      {getDocTypeLabel(doc.docType as DocType)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {doc.loadRef && (
                    <div className="text-xs text-[#8B95A5]">
                      <span className="text-[#4B6080]">Load</span>{' '}
                      <span className="text-white font-mono">{doc.loadRef}</span>
                    </div>
                  )}
                  <div className="text-xs text-[#8B95A5]">{formatDate(doc.createdAt)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
