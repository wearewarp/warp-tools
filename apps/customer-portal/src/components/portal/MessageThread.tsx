'use client';

import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  senderType: string;
  message: string;
  isRead: boolean | null;
  createdAt: string | null;
}

interface MessageThreadProps {
  messages: Message[];
  shipmentId: string;
}

function formatDateTime(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function MessageThread({ messages: initialMessages, shipmentId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, message: trimmed }),
      });

      if (res.ok) {
        const data = await res.json() as { message: Message };
        setMessages((prev) => [...prev, data.message]);
        setText('');
        textareaRef.current?.focus();
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Message thread */}
      {messages.length === 0 ? (
        <div className="text-center py-8 text-[#8B95A5] text-sm">
          No messages yet. Send a message to your broker below.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const isCustomer = msg.senderType === 'customer';
            return (
              <div
                key={msg.id}
                className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isCustomer ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isCustomer
                        ? 'bg-[#00C650] text-white rounded-br-sm'
                        : 'bg-[#1A2235] text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-xs text-[#8B95A5] px-1">
                    {isCustomer ? 'You' : 'Broker'} · {formatDateTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send form */}
      <div className="border-t border-[#1A2235] pt-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message to your broker..."
            rows={3}
            className="flex-1 rounded-lg border border-[#1A2235] bg-[#040810] px-4 py-3 text-sm text-white placeholder-[#8B95A5] focus:border-[#00C650] focus:outline-none focus:ring-1 focus:ring-[#00C650] resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="self-end px-4 py-3 rounded-lg bg-[#00C650] text-white hover:bg-[#00B347] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        <p className="text-xs text-[#8B95A5] mt-2">Press Cmd+Enter to send</p>
      </div>
    </div>
  );
}
