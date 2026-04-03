'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize?: number;
}

export function Pagination({ total, page, pageSize = 25 }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0 || totalPages <= 1) return null;

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete('page');
    } else {
      params.set('page', p.toString());
    }
    startTransition(() => router.push(`?${params.toString()}`));
  };

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-[#8B95A5]">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-[#8B95A5] text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p as number)}
              className={`min-w-[30px] px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-[#00C650] text-black'
                  : 'text-[#8B95A5] hover:text-white hover:bg-[#0C1528]'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#0C1528] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

  if (current < total - 2) pages.push('...');
  pages.push(total);

  return pages;
}
