'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Upload } from 'lucide-react';
import { DocTypeIcon } from './DocTypeIcon';
import { getDocTypeLabel } from '@/lib/utils';
import type { DocType } from '@/db/schema';

interface ChecklistItem {
  requiredType: DocType;
  fulfilled: boolean;
  documentId?: string | null;
  documentName?: string | null;
}

interface DocChecklistProps {
  items: ChecklistItem[];
  loadRef: string;
}

export function DocChecklist({ items, loadRef }: DocChecklistProps) {
  return (
    <div className="divide-y divide-[#1A2235] rounded-xl border border-[#1A2235] overflow-hidden">
      {items.map((item) => (
        <div
          key={item.requiredType}
          className="flex items-center gap-3 px-4 py-3 bg-[#080F1E] hover:bg-[#0C1528] transition-colors"
        >
          {/* Status icon */}
          <div className="flex-shrink-0">
            {item.fulfilled ? (
              <CheckCircle2 className="h-5 w-5 text-[#00C650]" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
          </div>

          {/* Doc type icon */}
          <DocTypeIcon docType={item.requiredType} size="sm" />

          {/* Label */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">
              {getDocTypeLabel(item.requiredType)}
            </div>
            {item.fulfilled && item.documentName && (
              <div className="text-xs text-[#8B95A5] truncate">{item.documentName}</div>
            )}
          </div>

          {/* Action */}
          {item.fulfilled && item.documentId ? (
            <Link
              href={`/documents/${item.documentId}`}
              className="text-xs text-[#4B8EE8] hover:text-blue-300 transition-colors"
            >
              View
            </Link>
          ) : !item.fulfilled ? (
            <Link
              href={`/documents?upload=true&loadRef=${encodeURIComponent(loadRef)}&docType=${item.requiredType}`}
              className="flex items-center gap-1 text-xs bg-[#1A2235] hover:bg-[#242E44] text-[#8B95A5] hover:text-white px-2 py-1 rounded-md transition-colors"
            >
              <Upload className="h-3 w-3" />
              Upload
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
