import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, dockDoors, facilities } from '@/db/schema';
import { eq, and, or, like, gte, lte, desc, asc, ne } from 'drizzle-orm';
import { calculateEndTime } from '@/lib/utils';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const doorId = searchParams.get('doorId') ?? '';
    const status = searchParams.get('status') ?? '';
    const type = searchParams.get('type') ?? '';
    const sortBy = searchParams.get('sortBy') ?? 'scheduled_date';
    const sortDir = searchParams.get('sortDir') ?? 'desc';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = 25;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (dateFrom) conditions.push(gte(appointments.scheduled_date, dateFrom));
    if (dateTo) conditions.push(lte(appointments.scheduled_date, dateTo));
    if (doorId) conditions.push(eq(appointments.dock_door_id, parseInt(doorId, 10)));
    if (status) conditions.push(eq(appointments.status, status as never));
    if (type) conditions.push(eq(appointments.appointment_type, type as never));
    if (search) {
      conditions.push(
        or(
          like(appointments.carrier_name, `%${search}%`),
          like(appointments.load_ref, `%${search}%`),
          like(appointments.po_number, `%${search}%`),
          like(appointments.truck_number, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn =
      sortBy === 'carrier_name'
        ? appointments.carrier_name
        : sortBy === 'scheduled_time'
        ? appointments.scheduled_time
        : sortBy === 'status'
        ? appointments.status
        : appointments.scheduled_date;

    const orderClause = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const secondaryOrder = sortDir === 'asc'
      ? asc(appointments.scheduled_time)
      : desc(appointments.scheduled_time);

    const rows = await db
      .select()
      .from(appointments)
      .where(whereClause)
      .orderBy(orderClause, secondaryOrder)
      .limit(limit)
      .offset(offset);

    // Count total (simple approach — query all with same filters)
    const allRows = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(whereClause);

    const doors = await db.select().from(dockDoors).orderBy(dockDoors.sort_order);

    return NextResponse.json({
      appointments: rows,
      doors,
      total: allRows.length,
      page,
      limit,
      totalPages: Math.ceil(allRows.length / limit),
    });
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
    const {
      dock_door_id,
      appointment_type,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      carrier_name,
      driver_name,
      truck_number,
      trailer_number,
      driver_phone,
      load_ref,
      po_number,
      commodity,
      special_instructions,
      notes,
    } = body;

    if (!dock_door_id || !appointment_type || !scheduled_date || !scheduled_time || !duration_minutes) {
      return NextResponse.json(
        { error: 'dock_door_id, appointment_type, scheduled_date, scheduled_time, duration_minutes are required' },
        { status: 400 }
      );
    }

    const endTime = calculateEndTime(scheduled_time, Number(duration_minutes));

    // Conflict check
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.dock_door_id, Number(dock_door_id)),
          eq(appointments.scheduled_date, scheduled_date),
          ne(appointments.status, 'cancelled'),
          ne(appointments.status, 'no_show')
        )
      );

    const newStart = timeToMinutes(scheduled_time);
    const newEnd = timeToMinutes(endTime);

    const conflicts = existing.filter((a) => {
      if (!a.end_time) return false;
      const aStart = timeToMinutes(a.scheduled_time);
      const aEnd = timeToMinutes(a.end_time);
      return newStart < aEnd && newEnd > aStart;
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Scheduling conflict',
          conflicts: conflicts.map((c) => ({
            id: c.id,
            carrier_name: c.carrier_name,
            scheduled_time: c.scheduled_time,
            end_time: c.end_time,
            status: c.status,
          })),
        },
        { status: 409 }
      );
    }

    const [appt] = await db
      .insert(appointments)
      .values({
        facility_id: facility.id,
        dock_door_id: Number(dock_door_id),
        appointment_type,
        scheduled_date,
        scheduled_time,
        duration_minutes: Number(duration_minutes),
        end_time: endTime,
        status: 'scheduled',
        carrier_name: carrier_name ?? null,
        driver_name: driver_name ?? null,
        truck_number: truck_number ?? null,
        trailer_number: trailer_number ?? null,
        driver_phone: driver_phone ?? null,
        load_ref: load_ref ?? null,
        po_number: po_number ?? null,
        commodity: commodity ?? null,
        special_instructions: special_instructions ?? null,
        notes: notes ?? null,
      })
      .returning();

    return NextResponse.json({ appointment: appt }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
