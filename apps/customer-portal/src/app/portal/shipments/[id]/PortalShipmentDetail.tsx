'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, MessageSquare, Activity, Send } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface PortalShipmentDetailProps {
  customer: { id: string; name: string };
  shipment: {
    id: string;
    shipmentNumber: string;
    status: string;
    originCity: string;
    originState: string;
    originZip: string | null;
    destCity: string;
    destState: string;
    destZip: string | null;
    pickupDate: string | null;
    deliveryDate: string | null;
    equipmentType: string | null;
    commodity: string | null;
    weight: number | null;
    bolNumber: string | null;
    poNumber: string | null;
    specialInstructions: string | null;
    currentLocationCity: string | null;
    currentLocationState: string | null;
    currentEta: string | null;
  };
  events: Array<{
    id: string;
    eventType: string;
    description: string;
    locationCity: string | null;
    locationState: string | null;
    createdAt: string | null;
  }>;
  documents: Array<{
    id: string;
    docType: string;
    originalName: string;
    filePath: string;
    fileSize: number | null;
    uploadedAt: string | null;
  }>;
  messages: Array<{
    id: string;
    senderType: string;
    message: string;
    isRead: boolean | null;
    createdAt: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  quote: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  booked: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_transit: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  at_pickup: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  at_delivery: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-[#00C650]/10 text-[#00C650] border-[#00C650]/20',
  invoiced: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  closed: 'bg-[#8B95A5]/10 text-[#8B95A5] border-[#8B95A5]/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function PortalShipmentDetail({ customer, shipment, events, documents, messages: initMessages }: PortalShipmentDetailProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'messages'>('timeline');
  const [messages, setMessages] = useState(initMessages);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!msgText.trim()) return;
    setSending(true);
    const res = await fetch('/api/portal/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipmentId: shipment.id, message: msgText }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setMsgText('');
    }
    setSending(false);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/portal" className="p-2 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono">{shipment.shipmentNumber}</h1>
              <span className={`inline-flex items-center border rounded px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[shipment.status] ?? STATUS_COLORS.booked}`}>
                {shipment.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-[#8B95A5] mt-0.5">
              {shipment.originCity}, {shipment.originState} → {shipment.destCity}, {shipment.destState}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Route */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Route</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#1A2235] bg-[#040810] p-3">
                <p className="text-xs text-[#00C650] font-medium mb-2 uppercase tracking-wider">Pickup</p>
                <p className="text-sm font-medium text-white">{shipment.originCity}, {shipment.originState} {shipment.originZip || ''}</p>
                <p className="text-xs text-[#8B95A5] mt-1">{formatDate(shipment.pickupDate)}</p>
              </div>
              <div className="rounded-lg border border-[#1A2235] bg-[#040810] p-3">
                <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">Delivery</p>
                <p className="text-sm font-medium text-white">{shipment.destCity}, {shipment.destState} {shipment.destZip || ''}</p>
                <p className="text-xs text-[#8B95A5] mt-1">{formatDate(shipment.deliveryDate)}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
            <div className="flex border-b border-[#1A2235]">
              {[
                { key: 'timeline', label: 'Updates', icon: Activity, count: events.length },
                { key: 'documents', label: 'Documents', icon: FileText, count: documents.length },
                { key: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
              ].map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'timeline' | 'documents' | 'messages')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-[#00C650] text-[#00C650]'
                      : 'border-transparent text-[#8B95A5] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center h-4 min-w-4 rounded-full text-xs px-1 ${
                      activeTab === key ? 'bg-[#00C650]/20 text-[#00C650]' : 'bg-[#1A2235] text-[#8B95A5]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'timeline' && (
              <div className="p-5">
                {events.length === 0 ? (
                  <p className="text-sm text-[#8B95A5] text-center py-8">No updates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2 w-2 rounded-full mt-1.5 ${i === events.length - 1 ? 'bg-[#00C650]' : 'bg-[#1A2235]'}`} />
                          {i < events.length - 1 && <div className="w-px flex-1 bg-[#1A2235] mt-1" />}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="text-sm text-white">{ev.description}</p>
                          {(ev.locationCity || ev.locationState) && (
                            <p className="text-xs text-[#8B95A5] mt-0.5">{ev.locationCity}, {ev.locationState}</p>
                          )}
                          <p className="text-xs text-[#8B95A5] mt-0.5">{formatDateTime(ev.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="p-5">
                {documents.length === 0 ? (
                  <p className="text-sm text-[#8B95A5] text-center py-8">No documents available.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-[#040810] rounded-lg px-3 py-3 border border-[#1A2235] hover:bg-[#0C1528] transition-colors"
                      >
                        <FileText className="h-4 w-4 text-[#8B95A5] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{doc.originalName}</p>
                          <p className="text-xs text-[#8B95A5]">{doc.docType.replace(/_/g, ' ')} · {formatDate(doc.uploadedAt)}</p>
                        </div>
                        <span className="text-xs text-[#00C650]">Download</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="p-5">
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-[#8B95A5] text-center py-8">No messages yet. Send a message to your broker.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                          m.senderType === 'customer'
                            ? 'bg-[#00C650]/10 text-[#00C650] border border-[#00C650]/20'
                            : 'bg-[#1A2235] text-slate-200'
                        }`}>
                          <p>{m.message}</p>
                          <p className="text-xs mt-1 opacity-60">{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Send a message to your broker..."
                    className="flex-1 bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!msgText.trim() || sending}
                    className="px-3 py-2 bg-[#00C650] text-white rounded-lg hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Shipment Details</h2>
            <dl className="space-y-2.5 text-sm">
              {shipment.equipmentType && (
                <div>
                  <dt className="text-xs text-[#8B95A5]">Equipment</dt>
                  <dd className="text-white capitalize">{shipment.equipmentType.replace(/_/g, ' ')}</dd>
                </div>
              )}
              {shipment.commodity && (
                <div>
                  <dt className="text-xs text-[#8B95A5]">Commodity</dt>
                  <dd className="text-white">{shipment.commodity}</dd>
                </div>
              )}
              {shipment.weight && (
                <div>
                  <dt className="text-xs text-[#8B95A5]">Weight</dt>
                  <dd className="text-white">{shipment.weight.toLocaleString()} lbs</dd>
                </div>
              )}
              {shipment.bolNumber && (
                <div>
                  <dt className="text-xs text-[#8B95A5]">BOL #</dt>
                  <dd className="text-white font-mono">{shipment.bolNumber}</dd>
                </div>
              )}
              {shipment.poNumber && (
                <div>
                  <dt className="text-xs text-[#8B95A5]">PO #</dt>
                  <dd className="text-white font-mono">{shipment.poNumber}</dd>
                </div>
              )}
            </dl>
          </div>

          {(shipment.currentLocationCity || shipment.currentEta) && (
            <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Live Tracking</h2>
              <dl className="space-y-2.5 text-sm">
                {shipment.currentLocationCity && (
                  <div>
                    <dt className="text-xs text-[#8B95A5]">Current Location</dt>
                    <dd className="text-white">{shipment.currentLocationCity}, {shipment.currentLocationState}</dd>
                  </div>
                )}
                {shipment.currentEta && (
                  <div>
                    <dt className="text-xs text-[#8B95A5]">ETA</dt>
                    <dd className="text-amber-400">{formatDateTime(shipment.currentEta)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
