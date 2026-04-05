export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { documents } from '@/db/schema';
import Link from 'next/link';
import { Building2, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { daysUntil } from '@/lib/utils';

interface CarrierGroup {
  carrierId: string;
  carrierName: string;
  docCount: number;
  expiringCount: number;
  expiredCount: number;
  docTypes: string[];
}

async function getCarriers(): Promise<CarrierGroup[]> {
  const allDocs = await db.select().from(documents);
  const carrierDocs = allDocs.filter((d) => d.carrierId && d.carrierName && d.status === 'active');

  const map = new Map<string, CarrierGroup>();
  for (const doc of carrierDocs) {
    const key = doc.carrierId!;
    if (!map.has(key)) {
      map.set(key, {
        carrierId: key,
        carrierName: doc.carrierName!,
        docCount: 0,
        expiringCount: 0,
        expiredCount: 0,
        docTypes: [],
      });
    }
    const group = map.get(key)!;
    group.docCount++;
    if (!group.docTypes.includes(doc.docType)) {
      group.docTypes.push(doc.docType);
    }
    if (doc.expiryDate) {
      const days = daysUntil(doc.expiryDate);
      if (days !== null) {
        if (days < 0) group.expiredCount++;
        else if (days <= 30) group.expiringCount++;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.carrierName.localeCompare(b.carrierName));
}

export default async function CarriersPage() {
  const carriers = await getCarriers();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Carrier Documents</h1>
        <p className="text-sm text-[#8B95A5] mt-1">
          View documents grouped by carrier — insurance certs, rate confirmations, authority letters
        </p>
      </div>

      {carriers.length === 0 ? (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <Building2 className="h-10 w-10 text-[#4B6080] mx-auto mb-3" />
          <p className="text-[#8B95A5]">No carrier documents yet.</p>
          <p className="text-sm text-[#4B6080] mt-1">Upload documents and link them to a carrier to see them here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {carriers.map((c) => (
            <Link
              key={c.carrierId}
              href={`/carriers/${encodeURIComponent(c.carrierId)}`}
              className="group flex items-center justify-between rounded-xl border border-[#1A2235] bg-[#080F1E] hover:border-[#242E44] hover:bg-[#0C1528] transition-all p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
                    {c.carrierName}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#8B95A5] flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {c.docCount} doc{c.docCount !== 1 ? 's' : ''}
                    </span>
                    {c.expiredCount > 0 && (
                      <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {c.expiredCount} expired
                      </span>
                    )}
                    {c.expiringCount > 0 && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                        {c.expiringCount} expiring
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#4B6080] group-hover:text-[#8B95A5] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
