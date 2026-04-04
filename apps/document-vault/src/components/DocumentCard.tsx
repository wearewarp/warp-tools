'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FileText, Image as ImageIcon, FileCheck, FileWarning } from 'lucide-react';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { Document } from '@/db/schema';
import { cn } from '@/lib/utils';

interface Props {
  doc: Document;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

const DOC_ICON_COLORS: Record<string, string> = {
  bol: 'text-blue-400',
  pod: 'text-green-400',
  rate_confirmation: 'text-purple-400',
  invoice: 'text-yellow-400',
  insurance_cert: 'text-orange-400',
  authority_letter: 'text-cyan-400',
  customs_declaration: 'text-pink-400',
  weight_certificate: 'text-indigo-400',
  lumper_receipt: 'text-teal-400',
  other: 'text-slate-400',
};

export function DocumentCard({ doc, selected, onSelect }: Props) {
  const [thumbError, setThumbError] = useState(false);
  const iconColor = DOC_ICON_COLORS[doc.docType] ?? 'text-slate-400';
  const isImage = doc.mimeType?.startsWith('image/');

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl bg-[#080F1E] border transition-colors overflow-hidden',
        selected
          ? 'border-[#00C650] ring-1 ring-[#00C650]/50'
          : 'border-[#1A2235] hover:border-[#2A3245]'
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={(e) => onSelect(doc.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-[#2A3245] bg-[#0C1528] accent-[#00C650] cursor-pointer"
            aria-label={`Select ${doc.originalName}`}
          />
        </div>
      )}

      {/* Thumbnail area */}
      <Link href={`/documents/${doc.id}`} className="block">
        <div className="relative h-36 bg-[#0C1528] flex items-center justify-center overflow-hidden">
          {doc.thumbnailPath && !thumbError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/documents/${doc.id}/thumbnail`}
              alt={doc.originalName}
              className="h-full w-full object-cover"
              onError={() => setThumbError(true)}
            />
          ) : (
            <div className={cn('flex flex-col items-center gap-1', iconColor)}>
              {isImage ? (
                <ImageIcon className="h-10 w-10 opacity-60" />
              ) : doc.docType === 'pod' ? (
                <FileCheck className="h-10 w-10 opacity-60" />
              ) : doc.docType === 'insurance_cert' ? (
                <FileWarning className="h-10 w-10 opacity-60" />
              ) : (
                <FileText className="h-10 w-10 opacity-60" />
              )}
              <span className="text-[10px] font-medium opacity-50 uppercase">
                {doc.mimeType === 'application/pdf' ? 'PDF' : doc.mimeType?.split('/')[1]?.toUpperCase() ?? 'FILE'}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <Link href={`/documents/${doc.id}`} className="block group/link">
          <p className="text-sm font-medium text-white truncate group-hover/link:text-[#00C650] transition-colors leading-snug">
            {doc.originalName}
          </p>
        </Link>

        <DocumentTypeBadge docType={doc.docType} size="sm" />

        {doc.loadRef && (
          <p className="text-xs text-[#8B95A5] truncate">
            <span className="text-[#4B8EE8]">{doc.loadRef}</span>
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10px] text-[#8B95A5]">
            {formatDate(doc.documentDate || doc.createdAt)}
          </span>
          <span className="text-[10px] text-[#8B95A5]">
            {formatFileSize(doc.fileSize)}
          </span>
        </div>
      </div>
    </div>
  );
}
