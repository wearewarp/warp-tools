'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Plus, Eye, EyeOff,
  FileText, MessageSquare, Activity, ChevronDown, Upload, Send
} from 'lucide-react';
import { showToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  customerId: string | null;
  customerName: string | null;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  pieces: number | null;
  originCity: string;
  originState: string;
  originZip: string | null;
  originAddress: string | null;
  originContactName: string | null;
  originContactPhone: string | null;
  destCity: string;
  destState: string;
  destZip: string | null;
  destAddress: string | null;
  destContactName: string | null;
  destContactPhone: string | null;
  pickupDate: string | null;
  pickupTimeWindow: string | null;
  deliveryDate: string | null;
  deliveryTimeWindow: string | null;
  actualPickupAt: string | null;
  actualDeliveryAt: string | null;
  customerRate: number | null;
  invoiceRef: string | null;
  invoiceStatus: string | null;
  invoiceAmount: number | null;
  specialInstructions: string | null;
  bolNumber: string | null;
  poNumber: string | null;
  proNumber: string | null;
  currentLocationCity: string | null;
  currentLocationState: string | null;
  currentEta: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  docCount: number;
}

interface ShipmentEvent {
  id: string;
  shipmentId: string | null;
  eventType: string;
  description: string;
  locationCity: string | null;
  locationState: string | null;
  isVisibleToCustomer: boolean | null;
  createdAt: string | null;
}

interface ShipmentDocument {
  id: string;
  shipmentId: string | null;
  docType: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  isVisibleToCustomer: boolean | null;
  uploadedAt: string | null;
  notes: string | null;
}

interface ShipmentMessage {
  id: string;
  customerId: string | null;
  senderType: string;
  message: string;
  isRead: boolean | null;
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

const ALL_STATUSES = ['quote', 'booked', 'in_transit', 'at_pickup', 'at_delivery', 'delivered', 'invoiced', 'closed', 'cancelled'];

interface Props {
  shipment: Shipment;
  events: ShipmentEvent[];
  documents: ShipmentDocument[];
  messages: ShipmentMessage[];
}

export function ShipmentDetailClient({ shipment: initial, events: initEvents, documents: initDocs, messages: initMessages }: Props) {
  const [shipment, setShipment] = useState(initial);
  const [events, setEvents] = useState(initEvents);
  const [documents, setDocuments] = useState(initDocs);
  const [messages, setMessages] = useState(initMessages);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'messages'>('timeline');

  // Add event form state
  const [eventDesc, setEventDesc] = useState('');
  const [eventType, setEventType] = useState('note');
  const [eventVisible, setEventVisible] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('other');
  const [uploadVisible, setUploadVisible] = useState(true);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Message form state
  const [msgText, setMsgText] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);

  const router = useRouter();

  async function changeStatus(newStatus: string) {
    const res = await fetch(`/api/admin/shipments/${shipment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setShipment((prev) => ({ ...prev, status: newStatus }));
      // Refresh events
      const evRes = await fetch(`/api/admin/shipments/${shipment.id}/events`);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events);
      }
      showToast(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    }
    setStatusOpen(false);
  }

  async function addEvent() {
    if (!eventDesc.trim()) return;
    setEventLoading(true);
    const res = await fetch(`/api/admin/shipments/${shipment.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: eventDesc, eventType, isVisibleToCustomer: eventVisible }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvents((prev) => [...prev, data.event]);
      setEventDesc('');
      setAddEventOpen(false);
      showToast('Event added');
    }
    setEventLoading(false);
  }

  async function uploadDocument() {
    if (!uploadFile) return;
    setUploadLoading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('docType', uploadDocType);
    fd.append('isVisibleToCustomer', String(uploadVisible));
    fd.append('notes', uploadNotes);

    const res = await fetch(`/api/admin/shipments/${shipment.id}/documents`, { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setDocuments((prev) => [...prev, data.document]);
      setUploadFile(null);
      setUploadOpen(false);
      showToast('Document uploaded');
    } else {
      showToast('Upload failed', 'error');
    }
    setUploadLoading(false);
  }

  async function toggleDocVisibility(doc: ShipmentDocument) {
    const res = await fetch(`/api/admin/shipments/${shipment.id}/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisibleToCustomer: !doc.isVisibleToCustomer }),
    });
    if (res.ok) {
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, isVisibleToCustomer: !d.isVisibleToCustomer } : d));
    }
  }

  async function deleteDocument(doc: ShipmentDocument) {
    await fetch(`/api/admin/shipments/${shipment.id}/documents/${doc.id}`, { method: 'DELETE' });
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    showToast('Document deleted');
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    setMsgLoading(true);
    const res = await fetch(`/api/admin/shipments/${shipment.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: shipment.customerId, message: msgText }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setMsgText('');
    }
    setMsgLoading(false);
  }

  async function deleteShipment() {
    await fetch(`/api/admin/shipments/${shipment.id}`, { method: 'DELETE' });
    showToast('Shipment deleted');
    router.push('/admin/shipments');
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/shipments" className="p-2 rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{shipment.shipmentNumber}</h1>
              <span className={`inline-flex items-center border rounded px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[shipment.status] ?? STATUS_COLORS.booked}`}>
                {shipment.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-[#8B95A5] mt-0.5">
              {shipment.customerName ?? 'No customer'} · {shipment.originCity}, {shipment.originState} → {shipment.destCity}, {shipment.destState}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status change */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-200 border border-[#1A2235] rounded-lg hover:bg-[#1A2235] transition-colors"
            >
              Update Status
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 w-48 rounded-lg border border-[#1A2235] bg-[#080F1E] shadow-xl">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#0C1528] ${shipment.status === s ? 'text-[#00C650]' : 'text-slate-200'}`}
                  >
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            href={`/admin/shipments/${shipment.id}/edit`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route card */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Route</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#1A2235] bg-[#040810] p-3">
                <p className="text-xs text-[#00C650] font-medium mb-2 uppercase tracking-wider">Origin / Pickup</p>
                <p className="text-sm font-medium text-white">{shipment.originCity}, {shipment.originState} {shipment.originZip || ''}</p>
                {shipment.originAddress && <p className="text-xs text-[#8B95A5] mt-0.5">{shipment.originAddress}</p>}
                {shipment.originContactName && <p className="text-xs text-slate-300 mt-1">{shipment.originContactName}</p>}
                {shipment.originContactPhone && <p className="text-xs text-[#8B95A5]">{shipment.originContactPhone}</p>}
                <p className="text-xs text-[#8B95A5] mt-2">{formatDate(shipment.pickupDate)} {shipment.pickupTimeWindow && `· ${shipment.pickupTimeWindow}`}</p>
              </div>
              <div className="rounded-lg border border-[#1A2235] bg-[#040810] p-3">
                <p className="text-xs text-purple-400 font-medium mb-2 uppercase tracking-wider">Destination / Delivery</p>
                <p className="text-sm font-medium text-white">{shipment.destCity}, {shipment.destState} {shipment.destZip || ''}</p>
                {shipment.destAddress && <p className="text-xs text-[#8B95A5] mt-0.5">{shipment.destAddress}</p>}
                {shipment.destContactName && <p className="text-xs text-slate-300 mt-1">{shipment.destContactName}</p>}
                {shipment.destContactPhone && <p className="text-xs text-[#8B95A5]">{shipment.destContactPhone}</p>}
                <p className="text-xs text-[#8B95A5] mt-2">{formatDate(shipment.deliveryDate)} {shipment.deliveryTimeWindow && `· ${shipment.deliveryTimeWindow}`}</p>
              </div>
            </div>
          </div>

          {/* Freight details */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Freight Details</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: 'Equipment', value: shipment.equipmentType?.replace(/_/g, ' ') },
                { label: 'Commodity', value: shipment.commodity },
                { label: 'Weight', value: shipment.weight ? `${shipment.weight.toLocaleString()} lbs` : null },
                { label: 'Pieces', value: shipment.pieces?.toString() },
                { label: 'BOL #', value: shipment.bolNumber },
                { label: 'PO #', value: shipment.poNumber },
                { label: 'PRO #', value: shipment.proNumber },
              ].map((item) => item.value ? (
                <div key={item.label} className="bg-[#040810] rounded-lg p-3">
                  <dt className="text-xs text-[#8B95A5]">{item.label}</dt>
                  <dd className="text-white mt-0.5">{item.value}</dd>
                </div>
              ) : null)}
            </dl>
            {shipment.specialInstructions && (
              <div className="mt-3 bg-[#040810] rounded-lg p-3">
                <dt className="text-xs text-[#8B95A5]">Special Instructions</dt>
                <dd className="text-sm text-white mt-0.5">{shipment.specialInstructions}</dd>
              </div>
            )}
          </div>

          {/* Tabs: Timeline / Documents / Messages */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] overflow-hidden">
            <div className="flex border-b border-[#1A2235]">
              {[
                { key: 'timeline', label: 'Timeline', icon: Activity, count: events.length },
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

            {/* Timeline tab */}
            {activeTab === 'timeline' && (
              <div className="p-5">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setAddEventOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#00C650] hover:text-[#00C650]/80 border border-[#00C650]/20 rounded-md px-2.5 py-1.5 hover:bg-[#00C650]/10 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Event
                  </button>
                </div>
                {events.length === 0 ? (
                  <p className="text-sm text-[#8B95A5] text-center py-8">No events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2 w-2 rounded-full mt-1.5 ${i === events.length - 1 ? 'bg-[#00C650]' : 'bg-[#1A2235]'}`} />
                          {i < events.length - 1 && <div className="w-px flex-1 bg-[#1A2235] mt-1" />}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm text-white">{ev.description}</p>
                              {(ev.locationCity || ev.locationState) && (
                                <p className="text-xs text-[#8B95A5] mt-0.5">{ev.locationCity}, {ev.locationState}</p>
                              )}
                              <p className="text-xs text-[#8B95A5] mt-0.5">{formatDateTime(ev.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-[#8B95A5] bg-[#1A2235] rounded px-1.5 py-0.5">{ev.eventType.replace(/_/g, ' ')}</span>
                              {ev.isVisibleToCustomer ? (
                                <Eye className="h-3.5 w-3.5 text-[#00C650]" aria-label="Visible to customer" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-[#8B95A5]" aria-label="Hidden from customer" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add event form */}
                {addEventOpen && (
                  <div className="mt-4 border border-[#1A2235] rounded-lg p-4 bg-[#040810]">
                    <h3 className="text-sm font-medium text-white mb-3">Add Event</h3>
                    <div className="space-y-3">
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00C650] outline-none"
                      >
                        <option value="note">Note</option>
                        <option value="check_call">Check Call</option>
                        <option value="status_change">Status Change</option>
                        <option value="document_added">Document Added</option>
                        <option value="invoice_update">Invoice Update</option>
                      </select>
                      <textarea
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        placeholder="Describe what happened..."
                        rows={3}
                        className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] outline-none resize-none"
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventVisible}
                          onChange={(e) => setEventVisible(e.target.checked)}
                          className="rounded border-[#1A2235] bg-[#040810]"
                        />
                        Visible to customer
                      </label>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setAddEventOpen(false)} className="px-3 py-1.5 text-xs text-slate-200 border border-[#1A2235] rounded-md hover:bg-[#1A2235]">
                          Cancel
                        </button>
                        <button
                          onClick={addEvent}
                          disabled={!eventDesc.trim() || eventLoading}
                          className="px-3 py-1.5 text-xs bg-[#00C650] text-white rounded-md hover:bg-[#00C650]/90 disabled:opacity-50"
                        >
                          Add Event
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents tab */}
            {activeTab === 'documents' && (
              <div className="p-5">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#00C650] hover:text-[#00C650]/80 border border-[#00C650]/20 rounded-md px-2.5 py-1.5 hover:bg-[#00C650]/10 transition-colors"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Document
                  </button>
                </div>

                {documents.length === 0 ? (
                  <p className="text-sm text-[#8B95A5] text-center py-8">No documents uploaded.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-3 bg-[#040810] rounded-lg px-3 py-3 border border-[#1A2235]">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-[#8B95A5] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{doc.originalName}</p>
                            <p className="text-xs text-[#8B95A5]">
                              {doc.docType.replace(/_/g, ' ')}
                              {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                              {` · ${formatDate(doc.uploadedAt)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleDocVisibility(doc)}
                            className="p-1.5 rounded hover:bg-[#1A2235] transition-colors"
                            title={doc.isVisibleToCustomer ? 'Hide from customer' : 'Show to customer'}
                          >
                            {doc.isVisibleToCustomer
                              ? <Eye className="h-3.5 w-3.5 text-[#00C650]" />
                              : <EyeOff className="h-3.5 w-3.5 text-[#8B95A5]" />}
                          </button>
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-[#1A2235] transition-colors text-[#8B95A5] hover:text-white"
                            title="Download"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => deleteDocument(doc)}
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-[#8B95A5] hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload form */}
                {uploadOpen && (
                  <div className="mt-4 border border-[#1A2235] rounded-lg p-4 bg-[#040810]">
                    <h3 className="text-sm font-medium text-white mb-3">Upload Document</h3>
                    <div className="space-y-3">
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-[#8B95A5] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-[#1A2235] file:text-white hover:file:bg-[#243047]"
                      />
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00C650] outline-none"
                      >
                        <option value="bol">BOL</option>
                        <option value="pod">POD</option>
                        <option value="invoice">Invoice</option>
                        <option value="rate_confirmation">Rate Confirmation</option>
                        <option value="customs">Customs</option>
                        <option value="weight_cert">Weight Certificate</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="text"
                        value={uploadNotes}
                        onChange={(e) => setUploadNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full bg-[#080F1E] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] outline-none"
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadVisible}
                          onChange={(e) => setUploadVisible(e.target.checked)}
                          className="rounded border-[#1A2235]"
                        />
                        Visible to customer
                      </label>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setUploadOpen(false)} className="px-3 py-1.5 text-xs text-slate-200 border border-[#1A2235] rounded-md hover:bg-[#1A2235]">
                          Cancel
                        </button>
                        <button
                          onClick={uploadDocument}
                          disabled={!uploadFile || uploadLoading}
                          className="px-3 py-1.5 text-xs bg-[#00C650] text-white rounded-md hover:bg-[#00C650]/90 disabled:opacity-50"
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages tab */}
            {activeTab === 'messages' && (
              <div className="p-5">
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-[#8B95A5] text-center py-8">No messages yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex ${m.senderType === 'broker' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                          m.senderType === 'broker'
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
                    placeholder="Send a message to the customer..."
                    className="flex-1 bg-[#040810] border border-[#1A2235] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#8B95A5]/50 focus:border-[#00C650] outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!msgText.trim() || msgLoading}
                    className="px-3 py-2 bg-[#00C650] text-white rounded-lg hover:bg-[#00C650]/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Financials */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Financials</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#8B95A5]">Customer Rate</dt>
                <dd className="font-mono text-white">{shipment.customerRate ? `$${shipment.customerRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8B95A5]">Invoice Amount</dt>
                <dd className="font-mono text-white">{shipment.invoiceAmount ? `$${shipment.invoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8B95A5]">Invoice Ref</dt>
                <dd className="text-white">{shipment.invoiceRef || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8B95A5]">Invoice Status</dt>
                <dd className="text-white capitalize">{shipment.invoiceStatus || '—'}</dd>
              </div>
            </dl>
          </div>

          {/* Tracking */}
          {(shipment.currentLocationCity || shipment.currentEta) && (
            <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Current Location</h2>
              <dl className="space-y-2.5 text-sm">
                {shipment.currentLocationCity && (
                  <div>
                    <dt className="text-xs text-[#8B95A5]">Location</dt>
                    <dd className="text-white">{shipment.currentLocationCity}, {shipment.currentLocationState}</dd>
                  </div>
                )}
                {shipment.currentEta && (
                  <div>
                    <dt className="text-xs text-[#8B95A5]">ETA</dt>
                    <dd className="text-white">{formatDateTime(shipment.currentEta)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl border border-[#1A2235] bg-[#080F1E] p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Details</h2>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-[#8B95A5]">Customer</dt>
                <dd className="text-white">
                  {shipment.customerId ? (
                    <Link href={`/admin/customers/${shipment.customerId}`} className="text-[#00C650] hover:underline">
                      {shipment.customerName}
                    </Link>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#8B95A5]">Created</dt>
                <dd className="text-white">{formatDate(shipment.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8B95A5]">Updated</dt>
                <dd className="text-white">{formatDate(shipment.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Shipment"
        description={`Are you sure you want to delete shipment ${shipment.shipmentNumber}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={deleteShipment}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
