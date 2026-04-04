import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  settlements,
  drivers,
  trips,
  settlementDeductions,
  settlementReimbursements,
  advances,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/settlements/[id] ─────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, settlementId));

    if (!settlement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [driver] = await db.select().from(drivers).where(eq(drivers.id, settlement.driver_id));

    const settlementTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.settlement_id, settlementId))
      .orderBy(trips.trip_date);

    const deductions = await db
      .select()
      .from(settlementDeductions)
      .where(eq(settlementDeductions.settlement_id, settlementId));

    const reimbursements = await db
      .select()
      .from(settlementReimbursements)
      .where(eq(settlementReimbursements.settlement_id, settlementId));

    const settlementAdvances = await db
      .select()
      .from(advances)
      .where(eq(advances.settlement_id, settlementId));

    return NextResponse.json({
      settlement,
      driver,
      trips: settlementTrips,
      deductions,
      reimbursements,
      advances: settlementAdvances,
    });
  } catch (err) {
    console.error('GET /api/settlements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch settlement' }, { status: 500 });
  }
}

// ─── PATCH /api/settlements/[id] ──────────────────────────────────────────────

const PatchSchema = z.object({
  notes: z.string().optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [updated] = await db
      .update(settlements)
      .set({ ...parsed.data, updated_at: new Date().toISOString() })
      .where(eq(settlements.id, settlementId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ settlement: updated });
  } catch (err) {
    console.error('PATCH /api/settlements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}

// ─── DELETE /api/settlements/[id] (void) ──────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const settlementId = parseInt(id, 10);
  if (isNaN(settlementId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Unlink trips
    await db
      .update(trips)
      .set({ settlement_id: null })
      .where(eq(trips.settlement_id, settlementId));

    // Unlink advances
    await db
      .update(advances)
      .set({ settlement_id: null, status: 'outstanding' })
      .where(and(eq(advances.settlement_id, settlementId), eq(advances.status, 'deducted')));

    // Delete deductions & reimbursements
    await db.delete(settlementDeductions).where(eq(settlementDeductions.settlement_id, settlementId));
    await db.delete(settlementReimbursements).where(eq(settlementReimbursements.settlement_id, settlementId));

    // Delete settlement
    await db.delete(settlements).where(eq(settlements.id, settlementId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/settlements/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete settlement' }, { status: 500 });
  }
}
