import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dockDoors, facilities } from '@/db/schema';
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
    return NextResponse.json({ doors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const [facility] = await db.select().from(facilities).limit(1);
    if (!facility) return NextResponse.json({ error: 'No facility found' }, { status: 404 });
    const body = await req.json();
    const { name, door_type, operating_hours_start, operating_hours_end, notes, sort_order } = body;
    if (!name || !door_type) {
      return NextResponse.json({ error: 'name and door_type are required' }, { status: 400 });
    }
    const [door] = await db
      .insert(dockDoors)
      .values({
        facility_id: facility.id,
        name,
        door_type,
        operating_hours_start: operating_hours_start ?? null,
        operating_hours_end: operating_hours_end ?? null,
        notes: notes ?? null,
        sort_order: sort_order ?? 0,
        status: 'active',
      })
      .returning();
    return NextResponse.json({ door }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
