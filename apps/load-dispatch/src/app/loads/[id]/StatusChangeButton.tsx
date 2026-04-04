'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import type { LoadStatus } from '@/db/schema';

interface Props {
  loadId: number;
  targetStatus: LoadStatus;
  label: string;
  variant?: 'green' | 'default' | 'red';
  className?: string;
}

export function StatusChangeButton({ loadId, targetStatus, label, variant = 'default', className = '' }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const variantClass =
    variant === 'green'
      ? 'bg-[#00C650] text-black hover:bg-[#00C650]/90'
      : variant === 'red'
        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
        : 'bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235]';

  async function handleClick() {
    if (targetStatus === 'cancelled') {
      setShowCancelModal(true);
      return;
    }
    await doStatusChange(undefined);
  }

  async function doStatusChange(cancellationReason: string | undefined) {
    setLoading(true);
    try {
      const body: Record<string, string> = { status: targetStatus };
      if (cancellationReason) body['cancellation_reason'] = cancellationReason;

      const res = await fetch(`/api/loads/${loadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ message: data.error ?? 'Failed to update status', type: 'error' });
        return;
      }

      toast({ message: `Status updated to ${targetStatus.replace('_', ' ')}`, type: 'success' });
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelConfirm() {
    if (!cancelReason.trim()) return;
    setShowCancelModal(false);
    await doStatusChange(cancelReason.trim());
    setCancelReason('');
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`}
      >
        {loading ? 'Updating…' : label}
      </button>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Cancel Load</h2>
            <p className="text-sm text-[#8B95A5] mb-4">Provide a reason for cancellation. This cannot be undone.</p>
            <label className="block text-xs text-[#8B95A5] font-medium mb-1.5">Cancellation Reason *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Shipper cancelled — cargo not ready"
              className="w-full bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-[#4B5563] focus:outline-none focus:border-[#00C650]/50 resize-none h-24"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
              >
                Keep Load
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={!cancelReason.trim() || loading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
