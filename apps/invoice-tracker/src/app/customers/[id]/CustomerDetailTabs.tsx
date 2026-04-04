'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface CustomerDetailTabsProps {
  activeTab: string;
  customerId: string;
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'loads', label: 'Loads' },
];

export function CustomerDetailTabs({ activeTab, customerId }: CustomerDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function goToTab(tab: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', tab);
    startTransition(() => router.push(`/customers/${customerId}?${p.toString()}`));
  }

  return (
    <div className="flex gap-1 border-b border-[#1A2235]">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => goToTab(key)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === key
              ? 'text-white border-[#00C650]'
              : 'text-[#8B95A5] border-transparent hover:text-white hover:border-[#1A2235]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
