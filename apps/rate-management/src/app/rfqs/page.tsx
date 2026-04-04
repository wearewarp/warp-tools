export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { rfqs, rfq_responses, lanes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  formatCurrency,
  formatDate,
  getRFQStatusLabel,
  getRFQStatusColor,
  getEquipmentLabel,
  cn,
} from '@/lib/utils';
import { FileQuestion, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

export default async function RFQsPage() {
  const allRFQs = await db.select().from(rfqs).orderBy(sql`created_at DESC`);

  const rfqData = await Promise.all(
    allRFQs.map(async rfq => {
      const responses = await db.select().from(rfq_responses).where(eq(rfq_responses.rfq_id, rfq.id));
      const lane = rfq.lane_id
        ? (await db.select().from(lanes).where(eq(lanes.id, rfq.lane_id)).limit(1))[0]
        : null;
      return { rfq, responses, lane };
    })
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileQuestion className="h-6 w-6 text-[#00C650]" />
            RFQs
          </h1>
          <p className="text-[#8B95A5] mt-1 text-sm">{allRFQs.length} request{allRFQs.length !== 1 ? 's' : ''} for quote</p>
        </div>
      </div>

      <div className="space-y-4">
        {rfqData.map(({ rfq, responses, lane }) => {
          const winner = responses.find(r => r.is_winner);
          return (
            <div key={rfq.id} className="bg-[#080F1E] border border-[#1A2235] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2235]">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{rfq.rfq_number}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', getRFQStatusColor(rfq.status))}>
                        {getRFQStatusLabel(rfq.status)}
                      </span>
                    </div>
                    {lane && (
                      <div className="flex items-center gap-1 text-sm text-[#8B95A5] mt-0.5">
                        <span>{lane.origin_city}, {lane.origin_state}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{lane.dest_city}, {lane.dest_state}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8B95A5]">Responses</div>
                  <div className="text-lg font-bold text-white">{responses.length}</div>
                </div>
              </div>

              {/* Details */}
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-[#8B95A5]">Equipment</div>
                  <div className="text-sm text-white mt-0.5">
                    {rfq.equipment_type ? getEquipmentLabel(rfq.equipment_type) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5] flex items-center gap-1"><Clock className="h-3 w-3" /> Pickup Date</div>
                  <div className="text-sm text-white mt-0.5">{formatDate(rfq.pickup_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5]">Target Rate</div>
                  <div className="text-sm text-white mt-0.5">{rfq.desired_rate ? formatCurrency(rfq.desired_rate) : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B95A5]">Created By</div>
                  <div className="text-sm text-white mt-0.5">{rfq.created_by ?? '—'}</div>
                </div>
              </div>

              {rfq.notes && (
                <div className="px-5 pb-3 text-xs text-[#8B95A5] italic">{rfq.notes}</div>
              )}

              {/* Awarded Banner */}
              {rfq.status === 'awarded' && (
                <div className="mx-5 mb-4 flex items-center gap-3 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-green-400">Awarded to {rfq.awarded_carrier}</div>
                    <div className="text-xs text-[#8B95A5] mt-0.5">
                      {rfq.awarded_rate ? formatCurrency(rfq.awarded_rate) : '—'} · {formatDate(rfq.awarded_at)}
                    </div>
                  </div>
                </div>
              )}

              {/* Responses */}
              {responses.length > 0 && (
                <div className="border-t border-[#1A2235]">
                  <div className="px-5 py-3 text-xs text-[#8B95A5] font-medium uppercase tracking-wide">
                    Responses
                  </div>
                  <div className="divide-y divide-[#1A2235]">
                    {responses.map(resp => (
                      <div key={resp.id} className={cn(
                        'flex items-center justify-between px-5 py-3',
                        resp.is_winner ? 'bg-green-400/5' : ''
                      )}>
                        <div className="flex items-center gap-3">
                          {resp.is_winner && <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />}
                          <div>
                            <div className="text-sm font-medium text-white">{resp.carrier_name}</div>
                            <div className="text-xs text-[#8B95A5] mt-0.5">
                              {resp.contact_name} · {resp.contact_email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn('text-sm font-semibold', resp.is_winner ? 'text-green-400' : 'text-white')}>
                            {formatCurrency(resp.rate_amount)}
                          </div>
                          <div className="text-xs text-[#8B95A5] mt-0.5">
                            Valid until {formatDate(resp.valid_until)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {allRFQs.length === 0 && (
          <div className="text-center py-20 text-[#8B95A5]">
            <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No RFQs yet</p>
            <p className="text-sm mt-1">Create your first RFQ to start collecting carrier rates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
