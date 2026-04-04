import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, loadTemplates } from '@/db/schema';
import { desc, asc, like, or, and, inArray, isNotNull, isNull, gte, lte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function generateLoadNumber(): string {
  const ts = Date.now().toString().slice(-6);
  return `WLD-${ts}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const search = searchParams.get('search') ?? '';
  const statuses = searchParams.getAll('status');
  const customer = searchParams.get('customer') ?? '';
  const equipment = searchParams.get('equipment') ?? '';
  const originState = searchParams.get('origin_state') ?? '';
  const destState = searchParams.get('dest_state') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const hasCarrier = searchParams.get('has_carrier') ?? '';
  const sortBy = searchParams.get('sort') ?? 'created_at';
  const sortDir = searchParams.get('dir') ?? 'desc';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(loads.load_number, `%${search}%`),
        like(loads.customer_name, `%${search}%`),
        like(loads.carrier_name, `%${search}%`),
        like(loads.origin_city, `%${search}%`),
        like(loads.dest_city, `%${search}%`),
      )
    );
  }

  if (statuses.length > 0) {
    conditions.push(sql`${loads.status} IN (${sql.join(statuses.map(s => sql`${s}`), sql`, `)})`);
  }

  if (customer) {
    conditions.push(like(loads.customer_name, `%${customer}%`));
  }

  if (equipment) {
    conditions.push(sql`${loads.equipment_type} = ${equipment}`);
  }

  if (originState) {
    conditions.push(sql`${loads.origin_state} = ${originState}`);
  }

  if (destState) {
    conditions.push(sql`${loads.dest_state} = ${destState}`);
  }

  if (dateFrom) {
    conditions.push(gte(loads.pickup_date, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(loads.pickup_date, dateTo));
  }

  if (hasCarrier === 'yes') {
    conditions.push(isNotNull(loads.carrier_name));
  } else if (hasCarrier === 'no') {
    conditions.push(isNull(loads.carrier_name));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = (() => {
    switch (sortBy) {
      case 'load_number': return loads.load_number;
      case 'customer_name': return loads.customer_name;
      case 'origin_city': return loads.origin_city;
      case 'dest_city': return loads.dest_city;
      case 'pickup_date': return loads.pickup_date;
      case 'delivery_date': return loads.delivery_date;
      case 'carrier_name': return loads.carrier_name;
      case 'customer_rate': return loads.customer_rate;
      case 'carrier_rate': return loads.carrier_rate;
      case 'margin': return loads.margin;
      case 'status': return loads.status;
      default: return loads.created_at;
    }
  })();

  const orderFn = sortDir === 'asc' ? asc : desc;

  const [allLoads, countResult] = await Promise.all([
    db.select().from(loads).where(where).orderBy(orderFn(sortColumn)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(loads).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return NextResponse.json({
    loads: allLoads,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();

  const load_number = body.load_number || generateLoadNumber();

  // Calculate margin if rates provided
  let margin: number | undefined;
  let margin_pct: number | undefined;
  if (body.customer_rate && body.carrier_rate) {
    margin = parseFloat((body.customer_rate - body.carrier_rate).toFixed(2));
    margin_pct = parseFloat(((margin / body.customer_rate) * 100).toFixed(1));
  }

  const [newLoad] = await db.insert(loads).values({
    ...body,
    load_number,
    margin,
    margin_pct,
    created_at: now,
    updated_at: now,
  }).returning();

  // If save_as_template flag set, create a template too
  if (body.save_as_template && body.template_name) {
    await db.insert(loadTemplates).values({
      name: body.template_name,
      customer_id: body.customer_id,
      customer_name: body.customer_name,
      origin_city: body.origin_city,
      origin_state: body.origin_state,
      dest_city: body.dest_city,
      dest_state: body.dest_state,
      equipment_type: body.equipment_type,
      weight: body.weight,
      commodity: body.commodity,
      customer_rate: body.customer_rate,
      special_instructions: body.special_instructions,
    });
  }

  return NextResponse.json({ load: newLoad }, { status: 201 });
}
