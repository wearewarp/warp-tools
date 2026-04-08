'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Copy, RefreshCw, Pencil, Trash2,
  ToggleLeft, ToggleRight, Package, MessageSquare,
  User, Mail, Phone, FileText, Send, Plus, Clock
} from 'lucide-react';
import { showToast } from '@/components/Toast';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  accessToken: string;
  isActive: boolean | null;
  lastLoginAt: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  customerRate: number | null;
}

interface Message {
  id: string;
  senderType: string;
  message: string;
  createdAt: string | null;
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

interface CustomerDetailClientProps {
  customer: Customer;
  shipments: Shipment[];
  messages: Message[];
}

export function CustomerDetailClient({ customer: initial, shipments, messages: initialMessages }: CustomerDetailClientProps) {
  const [customer, setCustomer] = useState(initial);
  const [messages, setMessages] = useState(initialMessages);
  const [activeTab, setActiveTab] = useState<'shipments' | 'messages' | 'activity'>('shipments');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function copyPortalLink() {
    const url = `${window.location.origin}/portal?token=${customer.accessToken}`;
    await navigator.clipboard.writeText(url);
    showToast('Portal link copied to clipboard');
  }

  async function toggleActive() {
    const newActive = !customer.isActive;
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newActive }),
    });
    if (res.ok) {
      setCustomer((prev) => ({ ...prev, isActive: newActive }));
      showToast(newActive ? 'Customer activated' : 'Customer deactivated');
    }
  }

  async function regenerateToken() {
    const res = await fetch(`/api/admin/customers/${customer.id}/regenerate-token`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      setCustomer((prev) => ({ ...prev, accessToken: data.customer.accessToken }));
      showToast('Access token regenerated');
    }
    setRegenOpen(false);
  }

  async function deleteCustomer() {
    await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' });
    showToast('Customer deleted');
    router.push('/admin/customers');
  }

  async function sendMessage() {
    if (!msgText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, message: msgText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMsgText('');
        showToast('Message sent');
      } else {
        showToast('Failed to send message', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSending(false);
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers" className="p-2 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
              {customer.isActive ? (
                <span className="inline-flex items-center bg-[#00C650]/10 text-[#00C650] border border-[#00C650]/20 rounded-md px-2 py-0.5 text-xs font-medium">Active</span>
              ) : (
                <span className="inline-flex items-center bg-[#8B95A5]/10 text-[#8B95A5] border border-[#8B95A5]/20 rounded-md px-2 py-0.5 text-xs font-medium">Inactive</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-[#8B95A5]">
              {customer.contactName && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{customer.contactName}</span>}
              {customer.contactEmail && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{customer.contactEmail}</span>}
              {customer.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.contactPhone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleActive}
            className="p-2 text-[#8B95A5] hover:text-white rounded-lg hover:bg-[#1A2235] transition-colors"
            title={customer.isActive ? 'Deactivate' : 'Activate'}
          >
            {customer.isActive
              ? <ToggleRight className="h-5 w-5 text-[#00C650]" />
              : <ToggleLeft className="h-5 w-5" />}
          </button>
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-[#8B95A5] hover:text-white border border-[#1A2235] rounded-lg hover:bg-[#1A2235] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Portal Access Card */}
      <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-4">Portal Access</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2">
              <code className="flex-1 text-xs text-[#00C650] font-mono truncate">/portal?token={customer.accessToken}</code>
            </div>
            <button onClick={copyPortalLink} className="p-2 text-[#8B95A5] hover:text-white rounded-lg hover:bg-[#1A2235]" title="Copy portal link">
              <Copy className="h-4 w-4" />
            </button>
            <button onClick={() => setRegenOpen(true)} className="p-2 text-[#8B95A5] hover:text-white rounded-lg hover:bg-[#1A2235]" title="Regenerate token">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleActive}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.isActive ? 'bg-[#00C650]' : 'bg-[#1A2235]'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${customer.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-[#8B95A5]">{customer.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <span className="text-[#8B95A5] text-xs">Last login: {customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : 'Never'}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5 mb-4">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-[#8B95A5] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#8B95A5] mb-1">Internal Notes</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1A2235] mb-4">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shipments' ? 'border-[#00C650] text-[#00C650]' : 'border-transparent text-[#8B95A5] hover:text-white'
          }`}
        >
          <Package className="h-4 w-4" /> Shipments ({shipments.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'messages' ? 'border-[#00C650] text-[#00C650]' : 'border-transparent text-[#8B95A5] hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'activity' ? 'border-[#00C650] text-[#00C650]' : 'border-transparent text-[#8B95A5] hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" /> Activity
        </button>
      </div>

      {/* Shipments Tab */}
      {activeTab === 'shipments' && (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
            <h2 className="text-sm font-semibold text-white">Shipments</h2>
            <Link
              href={`/admin/shipments/new?customerId=${customer.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-[#00C650] hover:text-[#00C650]/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Shipment
            </Link>
          </div>
          {shipments.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-8 w-8 text-[#8B95A5] mx-auto mb-2" />
              <p className="text-sm text-[#8B95A5]">No shipments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A2235]">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Shipment #</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Route</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Pickup</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A5]">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/admin/shipments/${s.id}`)}
                      className="border-b border-[#1A2235]/50 hover:bg-[#0C1528] cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-[#00C650] text-xs">{s.shipmentNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center border rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? STATUS_COLORS.booked}`}>
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 text-xs">{s.originCity}, {s.originState} → {s.destCity}, {s.destState}</td>
                      <td className="px-4 py-3 text-[#8B95A5] text-xs">{formatDate(s.pickupDate)}</td>
                      <td className="px-4 py-3 text-[#8B95A5] text-xs">{formatDate(s.deliveryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
          <div className="p-4 max-h-96 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-[#8B95A5] mx-auto mb-2" />
                <p className="text-sm text-[#8B95A5]">No messages yet. Start a conversation below.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderType === 'broker' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    m.senderType === 'broker'
                      ? 'bg-[#00C650]/10 border border-[#00C650]/20'
                      : 'bg-[#1A2235]'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#8B95A5]">
                        {m.senderType === 'broker' ? 'Broker' : 'Customer'}
                      </span>
                      <span className="text-xs text-[#8B95A5]/60">{m.createdAt ? formatDateTime(m.createdAt) : ''}</span>
                    </div>
                    <p className="text-sm text-slate-200">{m.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 p-4 border-t border-[#1A2235]">
            <input
              type="text"
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="flex-1 bg-[#040810] border border-[#1A2235] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] focus:ring-1 focus:ring-[#00C650] outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgText.trim()}
              className="bg-[#00C650] text-white hover:bg-[#00C650]/90 rounded-md p-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (() => {
        const activityItems = [
          ...(customer.lastLoginAt ? [{
            id: 'login',
            type: 'login',
            description: 'Logged into portal',
            createdAt: customer.lastLoginAt,
          }] : []),
          ...messages
            .filter(m => m.senderType === 'customer')
            .map(m => ({
              id: m.id,
              type: 'send_message',
              description: `Sent a message: "${m.message.substring(0, 60)}${m.message.length > 60 ? '...' : ''}"`,
              createdAt: m.createdAt,
            })),
        ].sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return (
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1A2235]">
              <h2 className="text-sm font-semibold text-white">Portal Activity</h2>
            </div>
            {activityItems.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="h-8 w-8 text-[#8B95A5] mx-auto mb-2" />
                <p className="text-sm text-[#8B95A5]">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A2235]">
                {activityItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      item.type === 'login' ? 'bg-blue-400' : 'bg-[#00C650]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{item.description}</p>
                      <p className="text-xs text-[#8B95A5]">{item.createdAt ? formatDateTime(item.createdAt) : '\u2014'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Metadata */}
      <div className="mt-4 rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-[#8B95A5]">Created</dt>
            <dd className="text-white">{formatDate(customer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8B95A5]">Updated</dt>
            <dd className="text-white">{formatDate(customer.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8B95A5]">Total Shipments</dt>
            <dd className="text-white">{shipments.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8B95A5]">Messages</dt>
            <dd className="text-white">{messages.length}</dd>
          </div>
        </dl>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.name}? This will also delete all their shipments and messages. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={deleteCustomer}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        open={regenOpen}
        title="Regenerate Access Token"
        description="This will invalidate the current portal link. The customer will need a new link to access their portal."
        confirmLabel="Regenerate"
        danger
        onConfirm={regenerateToken}
        onCancel={() => setRegenOpen(false)}
      />
    </div>
  );
}
