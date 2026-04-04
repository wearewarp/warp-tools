'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Upload, LayoutGrid, LayoutList, SlidersHorizontal,
  ChevronLeft, ChevronRight, X, Tag,
} from 'lucide-react';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentTypeBadge } from '@/components/DocumentTypeBadge';
import { UploadModal } from '@/components/UploadModal';
import { formatDate, formatFileSize, cn } from '@/lib/utils';
import type { Document, DocType } from '@/db/schema';
import { useToast } from '@/components/Toast';

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'bol', label: 'BOL' },
  { value: 'pod', label: 'POD' },
  { value: 'rate_confirmation', label: 'Rate Con' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'insurance_cert', label: 'Insurance' },
  { value: 'authority_letter', label: 'Authority' },
  { value: 'customs_declaration', label: 'Customs' },
  { value: 'weight_certificate', label: 'Weight Cert' },
  { value: 'lumper_receipt', label: 'Lumper' },
  { value: 'other', label: 'Other' },
];

interface BatchTagModalProps {
  selectedIds: string[];
  onClose: () => void;
  onDone: () => void;
}

function BatchTagModal({ selectedIds, onClose, onDone }: BatchTagModalProps) {
  const { toast } = useToast();
  const [docType, setDocType] = useState<DocType | ''>('');
  const [loadRef, setLoadRef] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleApply = async () => {
    const updates: Record<string, string> = {};
    if (docType) updates.docType = docType;
    if (loadRef) updates.loadRef = loadRef;
    if (carrierName) updates.carrierName = carrierName;
    if (customerName) updates.customerName = customerName;

    if (Object.keys(updates).length === 0) {
      toast({ message: 'Choose at least one field to update', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/documents/batch-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, updates }),
      });
      if (res.ok) {
        toast({ message: `Updated ${selectedIds.length} document${selectedIds.length !== 1 ? 's' : ''}`, type: 'success' });
        onDone();
      } else {
        const d = await res.json();
        toast({ message: d.error ?? 'Batch update failed', type: 'error' });
      }
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#080F1E] border border-[#1A2235] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2235]">
          <h2 className="text-lg font-semibold text-white">
            Batch Tag <span className="text-[#8B95A5] text-base font-normal">({selectedIds.length} docs)</span>
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#8B95A5]">Fields left blank will not be changed.</p>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType | '')}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00C650]/50"
            >
              <option value="">— no change —</option>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Load Ref</label>
            <input type="text" placeholder="LD-10041" value={loadRef} onChange={(e) => setLoadRef(e.target.value)}
              className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Carrier</label>
              <input type="text" placeholder="Carrier name" value={carrierName} onChange={(e) => setCarrierName(e.target.value)}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B95A5] mb-1.5">Customer</label>
              <input type="text" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg bg-[#1A2235] border border-[#2A3245] text-white text-sm px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1A2235]">
          <button onClick={onClose} className="rounded-lg border border-[#2A3245] px-4 py-2 text-sm text-[#8B95A5] hover:text-white transition-colors">Cancel</button>
          <button onClick={handleApply} disabled={saving}
            className="rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 disabled:opacity-60 transition-colors">
            {saving ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DocsResponse {
  documents: Document[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

function DocumentsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = (searchParams.get('view') as 'grid' | 'list') || 'grid';
  const perPage = view === 'grid' ? 24 : 25;

  const [data, setData] = useState<DocsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters / search state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedTypes, setSelectedTypes] = useState<DocType[]>(() =>
    searchParams.getAll('doc_type') as DocType[]
  );
  const [carrier, setCarrier] = useState(searchParams.get('carrier') || '');
  const [customer, setCustomer] = useState(searchParams.get('customer') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'active');
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at');
  const [order, setOrder] = useState(searchParams.get('order') || 'desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchTagOpen, setBatchTagOpen] = useState(false);

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      selectedTypes.forEach((t) => params.append('doc_type', t));
      if (carrier) params.set('carrier', carrier);
      if (customer) params.set('customer', customer);
      if (status && status !== 'all') params.set('status', status);
      params.set('sort', sort);
      params.set('order', order);
      params.set('page', String(page));
      params.set('per_page', String(perPage));

      const res = await fetch(`/api/documents?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, selectedTypes, carrier, customer, status, sort, order, page, perPage]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const updateView = (v: 'grid' | 'list') => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('view', v);
    router.replace(`/documents?${p}`);
  };

  const toggleType = (t: DocType) => {
    setPage(1);
    setSelected(new Set());
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (!data) return;
    if (selected.size === data.documents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.documents.map((d) => d.id)));
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  };

  const docs = data?.documents ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#1A2235] bg-[#040810] sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B95A5] pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-sm pl-9 pr-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B95A5] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
              showFilters
                ? 'border-[#00C650]/40 text-[#00C650] bg-[#00C650]/5'
                : 'border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245]'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(selectedTypes.length > 0 || carrier || customer || status !== 'active') && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00C650] text-[10px] text-black font-bold">
                {selectedTypes.length + (carrier ? 1 : 0) + (customer ? 1 : 0) + (status !== 'active' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => setBatchTagOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#00C650]/30 bg-[#00C650]/10 px-3 py-2 text-sm text-[#00C650] hover:bg-[#00C650]/20 transition-colors"
            >
              <Tag className="h-4 w-4" />
              Batch Tag ({selected.size})
            </button>
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-[#1A2235] overflow-hidden">
            <button
              onClick={() => updateView('grid')}
              className={cn(
                'flex h-9 w-9 items-center justify-center transition-colors',
                view === 'grid' ? 'bg-[#00C650]/10 text-[#00C650]' : 'text-[#8B95A5] hover:text-white hover:bg-[#0C1528]'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateView('list')}
              className={cn(
                'flex h-9 w-9 items-center justify-center transition-colors',
                view === 'list' ? 'bg-[#00C650]/10 text-[#00C650]' : 'text-[#8B95A5] hover:text-white hover:bg-[#0C1528]'
              )}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b border-[#1A2235] bg-[#040810] px-6 py-4 space-y-3">
          {/* Doc type chips */}
          <div>
            <p className="text-xs font-medium text-[#8B95A5] mb-2">Document Type</p>
            <div className="flex flex-wrap gap-1.5">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleType(t.value)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    selectedTypes.includes(t.value)
                      ? 'bg-[#00C650]/20 text-[#00C650] border border-[#00C650]/30'
                      : 'bg-[#0C1528] text-[#8B95A5] border border-[#1A2235] hover:border-[#2A3245] hover:text-white'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Carrier</label>
              <input type="text" placeholder="Filter by carrier" value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(1); }}
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-xs px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50" />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Customer</label>
              <input type="text" placeholder="Filter by customer" value={customer} onChange={(e) => { setCustomer(e.target.value); setPage(1); }}
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-xs px-3 py-2 placeholder:text-[#4B5563] focus:outline-none focus:border-[#00C650]/50" />
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#00C650]/50">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8B95A5] mb-1">Sort By</label>
              <div className="flex gap-1">
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="flex-1 rounded-lg bg-[#0C1528] border border-[#1A2235] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#00C650]/50">
                  <option value="created_at">Upload Date</option>
                  <option value="document_date">Doc Date</option>
                  <option value="doc_type">Type</option>
                  <option value="file_size">Size</option>
                  <option value="filename">Name</option>
                </select>
                <button onClick={() => setOrder((o) => o === 'asc' ? 'desc' : 'asc')}
                  className="rounded-lg bg-[#0C1528] border border-[#1A2235] px-2 py-2 text-[#8B95A5] hover:text-white transition-colors text-xs">
                  {order === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 rounded-full border-2 border-[#00C650] border-t-transparent animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0C1528] border border-[#1A2235]">
              <Search className="h-6 w-6 text-[#8B95A5]" />
            </div>
            <p className="text-white font-medium">No documents found</p>
            <p className="text-sm text-[#8B95A5]">Try adjusting your search or filters</p>
            <button onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#00C650] px-4 py-2 text-sm font-medium text-black hover:bg-[#00C650]/90 transition-colors mt-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        ) : view === 'grid' ? (
          <>
            {/* Select all + count */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={selected.size === docs.length && docs.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-[#2A3245] bg-[#0C1528] accent-[#00C650]"
                aria-label="Select all"
              />
              <span className="text-sm text-[#8B95A5]">
                {data?.total ?? 0} document{(data?.total ?? 0) !== 1 ? 's' : ''}
                {selected.size > 0 && ` · ${selected.size} selected`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {docs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  selected={selected.has(doc.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        ) : (
          /* List view */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-left border-b border-[#1A2235]">
                  <th className="pb-3 pr-4 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === docs.length && docs.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-[#2A3245] bg-[#0C1528] accent-[#00C650]"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Document</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Type</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Load Ref</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Carrier</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Customer</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Date</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-[#8B95A5]">Size</th>
                  <th className="pb-3 text-xs font-medium text-[#8B95A5]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2235]">
                {docs.map((doc) => (
                  <tr key={doc.id} className={cn('hover:bg-[#080F1E] transition-colors', selected.has(doc.id) && 'bg-[#00C650]/5')}>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={(e) => handleSelect(doc.id, e.target.checked)}
                        className="h-4 w-4 rounded border-[#2A3245] bg-[#0C1528] accent-[#00C650]"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <a href={`/documents/${doc.id}`} className="text-sm text-white hover:text-[#00C650] transition-colors font-medium truncate max-w-[200px] block">
                        {doc.originalName}
                      </a>
                      <p className="text-[10px] text-[#8B95A5] mt-0.5">{doc.mimeType}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <DocumentTypeBadge docType={doc.docType} size="sm" />
                    </td>
                    <td className="py-3 pr-4">
                      {doc.loadRef ? (
                        <span className="text-sm text-[#4B8EE8]">{doc.loadRef}</span>
                      ) : (
                        <span className="text-sm text-[#8B95A5]">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#8B95A5] truncate max-w-[120px] block">{doc.carrierName ?? '—'}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#8B95A5] truncate max-w-[120px] block">{doc.customerName ?? '—'}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#8B95A5] whitespace-nowrap">{formatDate(doc.documentDate || doc.createdAt)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-[#8B95A5] whitespace-nowrap">{formatFileSize(doc.fileSize)}</span>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        doc.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-slate-400/10'
                      )}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1A2235]">
            <span className="text-sm text-[#8B95A5]">
              Page {data.page} of {data.totalPages} · {data.total} documents
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1A2235] text-[#8B95A5] hover:text-white hover:border-[#2A3245] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); fetchDocs(); }}
      />

      {batchTagOpen && (
        <BatchTagModal
          selectedIds={Array.from(selected)}
          onClose={() => setBatchTagOpen(false)}
          onDone={() => { setBatchTagOpen(false); setSelected(new Set()); fetchDocs(); }}
        />
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 rounded-full border-2 border-[#00C650] border-t-transparent animate-spin" />
      </div>
    }>
      <DocumentsPageInner />
    </Suspense>
  );
}
