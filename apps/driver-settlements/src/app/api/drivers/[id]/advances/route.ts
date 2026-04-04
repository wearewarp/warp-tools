import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advances } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driverId = parseInt(id, 10);

  const driverAdvances = await db
    .select()
    .from(advances)
    .where(eq(advances.driver_id, driverId))
    .orderBy(desc(advances.date));

  return NextResponse.json(driverAdvances);
}
