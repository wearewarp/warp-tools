import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { trips } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driverId = parseInt(id, 10);
  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';

  const conditions = [eq(trips.driver_id, driverId)];

  if (dateFrom) {
    conditions.push(gte(trips.trip_date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(trips.trip_date, dateTo));
  }

  const driverTrips = await db
    .select()
    .from(trips)
    .where(and(...conditions))
    .orderBy(desc(trips.trip_date));

  return NextResponse.json(driverTrips);
}
