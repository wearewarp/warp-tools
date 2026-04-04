'use client';

import { useState } from 'react';
import { Download, FileText, FileWarning } from 'lucide-react';

interface Props {
  documentId: string;
  mimeType: string;
  originalName: string;
  className?: string;
}

export function FilePreview({ documentId, mimeType, originalName, className }: Props) {
  const fileUrl = `/api/documents/${documentId}/file`;
  const [iframeError, setIframeError] = useState(false);

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  if (isImage) {
    return (
      <div className={`flex items-center justify-center bg-[#0C1528] rounded-xl overflow-hidden ${className ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={originalName}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden flex-col items-center gap-3 p-8 text-center">
          <FileWarning className="h-12 w-12 text-[#8B95A5]" />
          <p className="text-sm text-[#8B95A5]">Image could not be loaded</p>
          <a
            href={fileUrl}
            download={originalName}
            className="flex items-center gap-1.5 text-sm text-[#00C650] hover:underline"
          >
            <Download className="h-4 w-4" />
            Download file
          </a>
        </div>
      </div>
    );
  }

  if (isPdf && !iframeError) {
    return (
      <div className={`flex flex-col bg-[#0C1528] rounded-xl overflow-hidden ${className ?? ''}`}>
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
          title={originalName}
          className="w-full flex-1 min-h-0"
          style={{ border: 'none', minHeight: '500px' }}
          onError={() => setIframeError(true)}
        />
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1A2235]">
          <span className="text-xs text-[#8B95A5]">{originalName}</span>
          <a
            href={fileUrl}
            download={originalName}
            className="flex items-center gap-1 text-xs text-[#00C650] hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </div>
    );
  }

  // Fallback: download prompt
  return (
    <div className={`flex flex-col items-center justify-center gap-4 bg-[#0C1528] rounded-xl p-10 ${className ?? ''}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A2235]">
        <FileText className="h-8 w-8 text-[#8B95A5]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">{originalName}</p>
        <p className="mt-1 text-xs text-[#8B95A5]">
          {isPdf ? 'PDF preview unavailable' : 'Preview not available for this file type'}
        </p>
      </div>
      <a
        href={fileUrl}
        download={originalName}
        className="flex items-center gap-2 rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 px-4 py-2 text-sm font-medium text-[#00C650] hover:bg-[#00C650]/20 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download File
      </a>
    </div>
  );
}
