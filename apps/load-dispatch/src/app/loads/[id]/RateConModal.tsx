'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Mail, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Props {
  loadId: number;
  loadNumber: string;
  carrierEmail?: string | null;
  onClose: () => void;
}

export function RateConModal({ loadId, loadNumber, carrierEmail, onClose }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/loads/${loadId}/rate-con`)
      .then((r) => r.json())
      .then((data) => {
        setText(data.text ?? '');
        setLoading(false);
      })
      .catch(() => {
        setText('Failed to load rate confirmation.');
        setLoading(false);
      });
  }, [loadId]);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ message: 'Copied to clipboard', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Rate Confirmation — Load ${loadNumber}`);
    const body = encodeURIComponent(text);
    const to = carrierEmail ? encodeURIComponent(carrierEmail) : '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Rate Confirmation</h2>
          <button onClick={onClose} className="text-[#8B95A5] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[#8B95A5] text-sm">Loading…</div>
          ) : (
            <pre className="text-xs text-slate-300 font-mono whitespace-pre bg-[#040810] border border-[#1A2235] rounded-xl p-4 overflow-auto leading-relaxed">
              {text}
            </pre>
          )}
        </div>

        <div className="flex gap-3 mt-4 flex-shrink-0">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4 text-[#00C650]" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleEmail}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            Open in Email
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-[#0C1528] text-slate-300 border border-[#1A2235] hover:bg-[#1A2235] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
