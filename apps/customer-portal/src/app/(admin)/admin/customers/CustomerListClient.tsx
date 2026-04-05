'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Search, Copy, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { showToast } from '@/components/Toast';
import { formatDateTime } from '@/lib/utils';

interface CustomerRow {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  accessToken: string;
  isActive: boolean | null;
  lastLoginAt: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  shipmentCount: number;
}

export function CustomerListClient({ customers: initial }: { customers: CustomerRow[] }) {
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.contactEmail && c.contactEmail.toLowerCase().includes(search.toLowerCase()))
      )
    : customers;

  async function copyPortalLink(e: React.MouseEvent, token: string) {
    e.stopPropagation();
    const url = `${window.location.origin}/portal?token=${token}`;
    await navigator.clipboard.writeText(url);
    showToast('Portal link copied to clipboard');
  }

  async function toggleActive(e: React.MouseEvent, customer: CustomerRow) {
    e.stopPropagation();
    const newActive = !customer.isActive;
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive }),
    });
    if (res.ok) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isActive: newActive } : c))
      );
      showToast(newActive ? 'Customer activated' : 'Customer deactivated');
    }
  }

  if (customers.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-sm text-[#8B95A5] mt-1">Manage your customer accounts</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#00C650]/10 border border-[#00C650]/20">
            <Users className="h-7 w-7 text-[#00C650]" />
          </div>
          <p className="text-sm text-[#8B95A5] mb-4">
            No customers yet. Add your first customer and share their portal link.
          </p>
          <Link
            href="/admin/customers/new"
            className="inline-flex items-center gap-2 bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-[#8B95A5] mt-1">Manage your customer accounts</p>
        </div>
        <Link
          href="/admin/customers/new"
          className="inline-flex items-center gap-2 bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#040810] border border-[#1A2235] rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2235]">
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Customer Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Active Shipments</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Last Login</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                  className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-200">{c.contactName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{c.contactEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{c.shipmentCount}</td>
                  <td className="px-4 py-3 text-[#8B95A5]">{c.lastLoginAt ? formatDateTime(c.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <span className="inline-flex items-center bg-[#00C650]/10 text-[#00C650] border border-[#00C650]/20 rounded-md px-2 py-0.5 text-xs font-medium">Active</span>
                    ) : (
                      <span className="inline-flex items-center bg-[#8B95A5]/10 text-[#8B95A5] border border-[#8B95A5]/20 rounded-md px-2 py-0.5 text-xs font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => copyPortalLink(e, c.accessToken)}
                        className="p-1.5 text-[#8B95A5] hover:text-white rounded-md hover:bg-[#1A2235] transition-colors"
                        title="Copy portal link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => toggleActive(e, c)}
                        className="p-1.5 text-[#8B95A5] hover:text-white rounded-md hover:bg-[#1A2235] transition-colors"
                        title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <ToggleRight className="h-4 w-4 text-[#00C650]" /> : <ToggleLeft className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
