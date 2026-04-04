'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface InvoiceBulkActionsProps {
  selectedIds: string[];
  onClear: () => void;
}

export function InvoiceBulkActions({ selectedIds, onClear }: InvoiceBulkActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  async function markAsSent() {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: 'sent' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast({ message: `${data.updated} invoice${data.updated !== 1 ? 's' : ''} marked as Sent`, type: 'success' });
      onClear();
      router.refresh();
    } catch {
      toast({ message: 'Failed to update invoices', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#00C650]/10 border border-[#00C650]/20 rounded-xl">
      <span className="text-sm font-medium text-[#00C650]">
        {selectedIds.length} selected
      </span>
      <button
        onClick={markAsSent}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-lg text-xs transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        {loading ? 'Updating...' : 'Mark as Sent'}
      </button>
      <button
        onClick={onClear}
        className="text-xs text-[#8B95A5] hover:text-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
