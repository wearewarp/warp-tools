import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dockDoors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doorId = parseInt(id, 10);
    const body = await req.json();
    const { name, door_type, operating_hours_start, operating_hours_end, notes, sort_order, status } = body;

    const [updated] = await db
      .update(dockDoors)
      .set({
        ...(name !== undefined && { name }),
        ...(door_type !== undefined && { door_type }),
        ...(operating_hours_start !== undefined && { operating_hours_start }),
        ...(operating_hours_end !== undefined && { operating_hours_end }),
        ...(notes !== undefined && { notes }),
        ...(sort_order !== undefined && { sort_order }),
        ...(status !== undefined && { status }),
      })
      .where(eq(dockDoors.id, doorId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Door not found' }, { status: 404 });
    return NextResponse.json({ door: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doorId = parseInt(id, 10);
    // Soft-delete: set inactive
    const [updated] = await db
      .update(dockDoors)
      .set({ status: 'inactive' })
      .where(eq(dockDoors.id, doorId))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Door not found' }, { status: 404 });
    return NextResponse.json({ door: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
