'use client';

import { useState } from 'react';
import { Mail, X, Copy, Check } from 'lucide-react';

interface Props {
  carrierName: string;
  contactEmail?: string | null;
  contactName?: string | null;
  insuranceType?: string;
  policyNumber?: string | null;
  expiryDate?: string | null;
  companyName?: string;
  /** Visual variant — 'default' is full pill, 'compact' is icon-only with tooltip */
  variant?: 'default' | 'compact';
}

const typeLabels: Record<string, string> = {
  auto_liability: 'Auto Liability',
  cargo: 'Cargo',
  general_liability: 'General Liability',
  workers_comp: "Workers' Comp",
};

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function RequestCertButton({
  carrierName,
  contactEmail,
  contactName,
  insuranceType,
  policyNumber,
  expiryDate,
  companyName = 'Your Company',
  variant = 'default',
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeLabel = insuranceType ? (typeLabels[insuranceType] ?? insuranceType) : 'insurance';
  const greeting = contactName ? `Hi ${contactName},` : 'Hi,';
  const policyLine = policyNumber ? ` (Policy #${policyNumber})` : '';
  const expiryLine = expiryDate ? formatDisplayDate(expiryDate) : 'soon';

  const subject = `Insurance Certificate Update Required — ${carrierName}`;
  const body = `${greeting}

Our records show that your ${typeLabel} certificate${policyLine} is expiring on ${expiryLine}.

Please send us an updated certificate of insurance at your earliest convenience.

Thank you,
${companyName}`;

  const mailtoLink = `mailto:${contactEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function copyTemplate() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={() => setShowDialog(true)}
          title="Request Updated Certificate"
          className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/20 transition-colors flex-shrink-0"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00C650]/10 border border-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/20 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Mail className="h-4 w-4" />
          Request Updated Cert
        </button>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1A2235]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#00C650]/10 border border-[#00C650]/20 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-[#00C650]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Request Updated Certificate</h2>
                  <p className="text-xs text-[#8B95A5]">{carrierName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="text-[#8B95A5] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email Preview */}
            <div className="p-5 space-y-3">
              <div>
                <div className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide mb-1.5">To</div>
                <div className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white font-mono">
                  {contactEmail ?? (
                    <span className="text-[#FFAA00]">No email on file — enter manually in email client</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide mb-1.5">Subject</div>
                <div className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white">
                  {subject}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#8B95A5] uppercase tracking-wide mb-1.5">Body</div>
                <div className="px-3 py-3 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-[#C4CDD8] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                  {body}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={copyTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm font-medium text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-[#00C650]" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <a
                href={mailtoLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00C650] hover:bg-[#00B347] text-black text-sm font-semibold transition-colors"
                onClick={() => setShowDialog(false)}
              >
                <Mail className="h-4 w-4" />
                Open in Email
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
