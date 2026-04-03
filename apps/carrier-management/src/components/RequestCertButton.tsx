'use client';

import { useState } from 'react';
import { Mail, X, Copy, Check } from 'lucide-react';

interface Props {
  carrierName: string;
  contactEmail?: string | null;
  insuranceType?: string;
}

const typeLabels: Record<string, string> = {
  auto_liability: 'Auto Liability',
  cargo: 'Cargo',
  general_liability: 'General Liability',
  workers_comp: "Workers' Comp",
};

export function RequestCertButton({ carrierName, contactEmail, insuranceType }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeLabel = insuranceType ? (typeLabels[insuranceType] ?? insuranceType) : 'insurance';

  const subject = `Certificate of Insurance Request — ${carrierName}`;
  const body = `Hello,

I'm reaching out regarding the ${typeLabel} certificate on file for ${carrierName}.

Our records show that the current certificate has expired or is expiring soon. To continue operating, we'll need an updated Certificate of Insurance (COI) from your carrier.

Please send the updated certificate at your earliest convenience to ensure there's no interruption to our working relationship.

Required coverage minimums:
• Auto Liability: $1,000,000
• Cargo: $100,000
• General Liability: $1,000,000

Please email the updated certificate directly to this address or upload it to our portal.

Thank you for your prompt attention to this matter.

Best regards`;

  const mailtoLink = `mailto:${contactEmail ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function copyTemplate() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00C650]/10 border border-[#00C650]/20 text-[#00C650] hover:bg-[#00C650]/20 text-sm font-medium transition-colors"
      >
        <Mail className="h-4 w-4" />
        Request Updated Certificate
      </button>

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
              <button onClick={() => setShowDialog(false)} className="text-[#8B95A5] hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email Preview */}
            <div className="p-5">
              <div className="mb-3">
                <div className="text-xs font-medium text-[#8B95A5] mb-1.5">TO</div>
                <div className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white font-mono">
                  {contactEmail ?? 'No email on file — enter manually'}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-medium text-[#8B95A5] mb-1.5">SUBJECT</div>
                <div className="px-3 py-2 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-white">
                  {subject}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#8B95A5] mb-1.5">BODY</div>
                <div className="px-3 py-3 rounded-lg bg-[#0C1528] border border-[#1A2235] text-sm text-[#8B95A5] whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                  {body}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={copyTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C1528] border border-[#1A2235] text-sm font-medium text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-[#00C650]" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
              <a
                href={mailtoLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00C650] hover:bg-[#00B347] text-black text-sm font-semibold transition-colors"
                onClick={() => setShowDialog(false)}
              >
                <Mail className="h-4 w-4" />
                Open in Email Client
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
