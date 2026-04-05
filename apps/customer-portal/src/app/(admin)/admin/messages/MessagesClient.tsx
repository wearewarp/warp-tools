'use client';

import { MessageSquare } from 'lucide-react';

interface Conversation {
  customerId: string | null;
  customerName: string | null;
  customerContactName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function MessagesClient({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
        <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[#8B95A5] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-sm text-[#8B95A5]">Customer messages will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
      <div className="bg-[#080F1E] border border-[#1A2235] rounded-xl divide-y divide-[#1A2235]">
        {conversations.map((c) => (
          <div key={c.customerId} className="p-4 hover:bg-[#0C1528] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{c.customerName}</div>
                <p className="text-xs text-[#8B95A5] mt-1 line-clamp-1">{c.lastMessage}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8B95A5]">{c.lastMessageAt}</div>
                {c.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00C650] text-white text-[10px] font-bold mt-1">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
