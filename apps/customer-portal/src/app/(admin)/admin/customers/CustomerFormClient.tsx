'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { showToast } from '@/components/Toast';

interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isActive: boolean | null;
}

interface CustomerFormClientProps {
  mode: 'create' | 'edit';
  customer?: Customer;
}

export function CustomerFormClient({ mode, customer }: CustomerFormClientProps) {
  const [name, setName] = useState(() => customer?.name ?? '');
  const [contactName, setContactName] = useState(() => customer?.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(() => customer?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(() => customer?.contactPhone ?? '');
  const [notes, setNotes] = useState(() => customer?.notes ?? '');
  const [isActive, setIsActive] = useState(() => customer?.isActive !== false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Company name is required';
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const payload = { name: name.trim(), contactName, contactEmail, contactPhone, notes, isActive };

    try {
      const url = mode === 'create' ? '/api/admin/customers' : `/api/admin/customers/${customer!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(mode === 'create' ? 'Customer created' : 'Customer updated');
        router.push(`/admin/customers/${data.customer.id}`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Something went wrong', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={mode === 'edit' ? `/admin/customers/${customer!.id}` : '/admin/customers'}
          className="p-2 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          {mode === 'create' ? 'Add Customer' : 'Edit Customer'}
        </h1>
      </div>

      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="John Smith"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="john@acme.com"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
            />
            {errors.contactEmail && <p className="mt-1 text-xs text-red-400">{errors.contactEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this customer..."
              rows={3}
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-200">Portal Active</label>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-[#00C650]' : 'bg-[#1A2235]'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-xs text-[#8B95A5]">{isActive ? 'Customer can access the portal' : 'Portal access disabled'}</span>
          </div>

          {mode === 'create' && (
            <div className="rounded-lg border border-[#1A2235] bg-[#040810] p-3">
              <p className="text-xs text-[#8B95A5]">
                <span className="text-[#00C650] font-medium">Note:</span> An access token will be automatically generated. You can share the portal link with the customer from the customer detail page.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={mode === 'edit' ? `/admin/customers/${customer!.id}` : '/admin/customers'}
              className="px-4 py-2 text-sm font-medium text-slate-200 border border-[#1A2235] rounded-lg hover:bg-[#1A2235] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#00C650] text-white rounded-lg hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'create' ? 'Create Customer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
