'use client';

import { useState, useRef } from 'react';
import { Shield, Loader2 } from 'lucide-react';

export default function PortalLoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (res.ok) {
        window.location.href = '/portal';
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid access code. Please check with your broker.');
        inputRef.current?.focus();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00C650]/10 border border-[#00C650]/20">
              <Shield className="h-6 w-6 text-[#00C650]" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white text-center">
            Shipment Portal
          </h1>
          <p className="text-sm text-[#8B95A5] text-center mt-2 mb-6">
            Enter your access code to view your shipments
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={token}
                onChange={(e) => { setToken(e.target.value); setError(''); }}
                placeholder="Enter access code"
                autoFocus
                className="w-full rounded-lg border border-[#1A2235] bg-[#040810] px-4 py-3 text-sm text-white placeholder-[#8B95A5] transition-colors focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650]"
              />
            </div>

            {error && (
              <p className="text-sm text-[#FF4444]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || token.trim().length === 0}
              className="w-full rounded-lg bg-[#00C650] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#00B347] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Portal'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-[#8B95A5] text-center mt-6">
            Don&apos;t have an access code? Contact your broker.
          </p>
        </div>
      </div>
    </div>
  );
}
