import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, type LoadStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  new: ['posted', 'cancelled'],
  posted: ['covered', 'cancelled'],
  covered: ['dispatched', 'cancelled'],
  dispatched: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['invoiced', 'cancelled'],
  invoiced: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

const STATUS_TIMESTAMP: Partial<Record<LoadStatus, keyof typeof loads.$inferInsert>> = {
  posted: 'posted_at',
  covered: 'covered_at',
  dispatched: 'dispatched_at',
  picked_up: 'picked_up_at',
  delivered: 'delivered_at',
  invoiced: 'invoiced_at',
  closed: 'closed_at',
  cancelled: 'cancelled_at',
};

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const newStatus = body.status as LoadStatus;
  const notes = body.notes as string | undefined;
  const cancellationReason = body.cancellation_reason as string | undefined;

  if (!newStatus) return NextResponse.json({ error: 'status is required' }, { status: 400 });

  const allowed = VALID_TRANSITIONS[load.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${load.status} to ${newStatus}` },
      { status: 422 }
    );
  }

  if (newStatus === 'cancelled' && !cancellationReason) {
    return NextResponse.json({ error: 'cancellation_reason is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const timestampField = STATUS_TIMESTAMP[newStatus];

  const updateData: Record<string, string | null> = {
    status: newStatus,
    updated_at: now,
  };

  if (timestampField) {
    updateData[timestampField as string] = now;
  }

  if (newStatus === 'cancelled' && cancellationReason) {
    updateData['cancellation_reason'] = cancellationReason;
  }

  if (notes) {
    updateData['notes'] = (load.notes ? load.notes + '\n' : '') + notes;
  }

  await db.update(loads).set(updateData as never).where(eq(loads.id, loadId));

  const [updated] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  return NextResponse.json({ load: updated });
}
