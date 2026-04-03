'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface SortHeaderProps {
  href: string;
  label: string;
  isActive: boolean;
  dir: 'asc' | 'desc';
  className?: string;
}

export function SortHeader({ href, label, isActive, dir, className = '' }: SortHeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <th
      onClick={() => startTransition(() => router.push(href))}
      className={`text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 cursor-pointer select-none transition-colors hover:text-white ${
        isActive ? 'text-white' : 'text-[#8B95A5]'
      } ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span
          className="text-[10px] leading-none"
          style={{ opacity: isActive ? 1 : 0.3 }}
        >
          {isActive && dir === 'desc' ? '▼' : '▲'}
        </span>
      </span>
    </th>
  );
}
