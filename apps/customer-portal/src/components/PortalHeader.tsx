'use client';

import Link from 'next/link';
import { Truck, LogOut, Package } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PortalHeaderProps {
  customerName?: string | null;
}

export function PortalHeader({ customerName }: PortalHeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/portal/logout', { method: 'POST' });
    } finally {
      router.push('/portal/login');
    }
  }

  return (
    <header className="h-16 bg-[#040810] border-b border-[#1A2235] flex items-center justify-between px-6 flex-shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C650]/10 border border-[#00C650]/20">
          <Truck className="h-4 w-4 text-[#00C650]" />
        </div>
        <span className="text-sm font-semibold text-white hidden sm:block">
          Shipment Portal
        </span>
      </div>

      {/* Nav + user */}
      <div className="flex items-center gap-2">
        {/* Nav link */}
        <Link
          href="/portal"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-all"
        >
          <Package className="h-4 w-4" />
          <span className="hidden sm:block">Shipments</span>
        </Link>

        {/* Customer name badge */}
        {customerName && (
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-[#1A2235] text-xs text-[#8B95A5]">
            {customerName}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-all disabled:opacity-50"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
