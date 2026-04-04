import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { facilities, dockDoors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [facility] = await db.select().from(facilities).limit(1);
    if (!facility) return NextResponse.json({ error: 'No facility found' }, { status: 404 });
    const doors = await db
      .select()
      .from(dockDoors)
      .where(eq(dockDoors.facility_id, facility.id))
      .orderBy(dockDoors.sort_order);
    return NextResponse.json({ facility, doors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const [facility] = await db.select().from(facilities).limit(1);
    if (!facility) return NextResponse.json({ error: 'No facility found' }, { status: 404 });
    const body = await req.json();
    const {
      name,
      address_street,
      address_city,
      address_state,
      address_zip,
      operating_hours_start,
      operating_hours_end,
      timezone,
      buffer_minutes,
      notes,
    } = body;

    const [updated] = await db
      .update(facilities)
      .set({
        ...(name !== undefined && { name }),
        ...(address_street !== undefined && { address_street }),
        ...(address_city !== undefined && { address_city }),
        ...(address_state !== undefined && { address_state }),
        ...(address_zip !== undefined && { address_zip }),
        ...(operating_hours_start !== undefined && { operating_hours_start }),
        ...(operating_hours_end !== undefined && { operating_hours_end }),
        ...(timezone !== undefined && { timezone }),
        ...(buffer_minutes !== undefined && { buffer_minutes: Number(buffer_minutes) }),
        ...(notes !== undefined && { notes }),
      })
      .where(eq(facilities.id, facility.id))
      .returning();

    return NextResponse.json({ facility: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
