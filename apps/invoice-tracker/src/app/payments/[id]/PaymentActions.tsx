'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ThumbsUp, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface PaymentActionsProps {
  paymentId: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
}

export function PaymentActions({ paymentId, status }: PaymentActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [refNum, setRefNum] = useState('');

  async function patch(body: Record<string, unknown>, actionKey: string) {
    setLoading(actionKey);
    try {
      const res = await fetch(`/api/carrier-payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      return true;
    } catch {
      return false;
    } finally {
      setLoading(null);
    }
  }

  async function handleApprove() {
    const ok = await patch({ status: 'approved' }, 'approve');
    if (ok) {
      toast({ message: 'Payment approved', type: 'success' });
      router.refresh();
    } else {
      toast({ message: 'Failed to approve payment', type: 'error' });
    }
  }

  async function handleMarkPaid() {
    const ok = await patch(
      { status: 'paid', paidDate, referenceNumber: refNum || null },
      'paid'
    );
    if (ok) {
      toast({ message: 'Payment marked as paid', type: 'success' });
      setShowMarkPaidModal(false);
      router.refresh();
    } else {
      toast({ message: 'Failed to update payment', type: 'error' });
    }
  }

  async function handleDispute() {
    const ok = await patch({ status: 'disputed' }, 'dispute');
    if (ok) {
      toast({ message: 'Payment marked as disputed', type: 'success' });
      router.refresh();
    } else {
      toast({ message: 'Failed to update payment', type: 'error' });
    }
  }

  async function handleDelete() {
    setLoading('delete');
    try {
      const res = await fetch(`/api/carrier-payments/${paymentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast({ message: 'Payment deleted', type: 'success' });
      router.push('/payments');
    } catch {
      toast({ message: 'Failed to delete payment', type: 'error' });
      setLoading(null);
    }
  }

  const btnBase =
    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {status === 'pending' && (
          <button
            onClick={handleApprove}
            disabled={loading === 'approve'}
            className={`${btnBase} bg-[#4B8EE8]/10 border-[#4B8EE8]/20 text-[#4B8EE8] hover:bg-[#4B8EE8]/20 disabled:opacity-50`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </button>
        )}

        {status === 'approved' && (
          <button
            onClick={() => setShowMarkPaidModal(true)}
            className={`${btnBase} bg-[#00C650]/10 border-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/20`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark as Paid
          </button>
        )}

        {status !== 'paid' && (
          <button
            onClick={handleDispute}
            disabled={loading === 'dispute' || status === 'disputed'}
            className={`${btnBase} bg-[#FF4444]/10 border-[#FF4444]/20 text-[#FF4444] hover:bg-[#FF4444]/20 disabled:opacity-50`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {loading === 'dispute' ? 'Updating...' : status === 'disputed' ? 'Disputed' : 'Dispute'}
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className={`${btnBase} bg-[#FF4444]/5 border-[#FF4444]/10 text-[#FF4444]/60 hover:text-[#FF4444] hover:bg-[#FF4444]/10`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Mark as Paid</h2>
            <p className="text-sm text-[#8B95A5] mb-5">Confirm payment details.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Paid Date</label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white focus:outline-none focus:border-[#00C650]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">
                  Reference # <span className="text-[#8B95A5]/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                  placeholder="ACH-00123 or CHK-456"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm text-white placeholder-[#8B95A5]/50 focus:outline-none focus:border-[#00C650]/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleMarkPaid}
                disabled={loading === 'paid'}
                className="flex-1 py-2.5 bg-[#00C650] hover:bg-[#00B347] disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
              >
                {loading === 'paid' ? 'Saving...' : 'Confirm Paid'}
              </button>
              <button
                onClick={() => setShowMarkPaidModal(false)}
                className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#080F1E] border border-[#1A2235] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Delete Payment?</h2>
            <p className="text-sm text-[#8B95A5] mb-5">
              This cannot be undone. The payment record will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading === 'delete'}
                className="flex-1 py-2.5 bg-[#FF4444] hover:bg-[#CC3333] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {loading === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 bg-[#0C1528] hover:bg-[#1A2235] text-[#8B95A5] hover:text-white font-medium rounded-xl text-sm border border-[#1A2235] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
