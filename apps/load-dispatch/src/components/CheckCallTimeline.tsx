'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Pencil, Trash2, Phone, MessageSquare, Mail, Radio, MoreHorizontal, MapPin, Clock } from 'lucide-react';
import type { CheckCall } from '@/db/schema';
import { CheckCallModal } from '@/app/loads/[id]/CheckCallModal';

interface Props {
  loadId: number;
  checkCalls: CheckCall[];
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-slate-400',
  at_pickup: 'bg-blue-400',
  loading: 'bg-blue-500',
  loaded: 'bg-purple-400',
  in_transit: 'bg-cyan-400',
  at_delivery: 'bg-orange-400',
  unloading: 'bg-orange-500',
  delivered: 'bg-green-400',
  delayed: 'bg-yellow-400',
  issue: 'bg-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  at_pickup: 'At Pickup',
  loading: 'Loading',
  loaded: 'Loaded',
  in_transit: 'In Transit',
  at_delivery: 'At Delivery',
  unloading: 'Unloading',
  delivered: 'Delivered',
  delayed: 'Delayed',
  issue: 'Issue',
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'text-slate-300 bg-slate-300/10',
  at_pickup: 'text-blue-400 bg-blue-400/10',
  loading: 'text-blue-500 bg-blue-500/10',
  loaded: 'text-purple-400 bg-purple-400/10',
  in_transit: 'text-cyan-400 bg-cyan-400/10',
  at_delivery: 'text-orange-400 bg-orange-400/10',
  unloading: 'text-orange-500 bg-orange-500/10',
  delivered: 'text-green-400 bg-green-400/10',
  delayed: 'text-yellow-400 bg-yellow-400/10',
  issue: 'text-red-400 bg-red-400/10',
};

function ContactIcon({ method }: { method: string | null }) {
  switch (method) {
    case 'phone': return <Phone className="h-3.5 w-3.5" />;
    case 'text': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'email': return <Mail className="h-3.5 w-3.5" />;
    case 'tracking': return <Radio className="h-3.5 w-3.5" />;
    default: return <MoreHorizontal className="h-3.5 w-3.5" />;
  }
}

function formatTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatEta(eta: string | null) {
  if (!eta) return null;
  return new Date(eta).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface TimelineNodeProps {
  call: CheckCall;
  isLast: boolean;
  loadId: number;
}

function TimelineNode({ call, isLast, loadId }: TimelineNodeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this check call?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/check-calls/${call.id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast({ message: 'Failed to delete check call', type: 'error' });
        return;
      }
      toast({ message: 'Check call deleted', type: 'success' });
      router.refresh();
    } catch {
      toast({ message: 'Network error', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  const dotColor = STATUS_DOT[call.status] ?? 'bg-slate-400';
  const badgeClass = STATUS_BADGE[call.status] ?? 'text-slate-400 bg-slate-400/10';
  const eta = formatEta(call.eta);

  return (
    <>
      <div className="relative flex gap-4 group">
        {/* Timeline line + dot */}
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 ring-[#080F1E] ${dotColor}`} />
          {!isLast && <div className="w-px flex-1 bg-[#1A2235] mt-1" />}
        </div>

        {/* Content */}
        <div className="pb-5 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${badgeClass}`}>
                {STATUS_LABEL[call.status] ?? call.status}
              </span>
              {call.location_city && (
                <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
                  <MapPin className="h-3 w-3" />
                  {call.location_city}{call.location_state ? `, ${call.location_state}` : ''}
                </span>
              )}
            </div>

            {/* Edit/delete — hover reveal */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-md text-[#8B95A5] hover:text-white hover:bg-[#1A2235] transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-md text-[#8B95A5] hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-[#8B95A5]">{formatTs(call.created_at)}</span>
            {eta && (
              <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
                <Clock className="h-3 w-3" />
                ETA {eta}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[#8B95A5]">
              <ContactIcon method={call.contact_method} />
              {call.contact_method ?? 'other'}
            </span>
          </div>

          {call.notes && (
            <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">{call.notes}</p>
          )}
        </div>
      </div>

      {showEdit && (
        <CheckCallModal
          loadId={loadId}
          existing={call}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

export function CheckCallTimeline({ loadId, checkCalls }: Props) {
  const [showAdd, setShowAdd] = useState(false);

  // Most recent first
  const sorted = [...checkCalls].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Check Call Timeline</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00C650] text-black hover:bg-[#00C650]/90 transition-colors"
        >
          + Add Check Call
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-[#8B95A5] text-sm">
          <Radio className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No check calls yet</p>
          <p className="text-xs mt-1 opacity-60">Add updates as the carrier moves through the route</p>
        </div>
      ) : (
        <div>
          {sorted.map((call, i) => (
            <TimelineNode key={call.id} call={call} isLast={i === sorted.length - 1} loadId={loadId} />
          ))}
        </div>
      )}

      {showAdd && (
        <CheckCallModal loadId={loadId} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
