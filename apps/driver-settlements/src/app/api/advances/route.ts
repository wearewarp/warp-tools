import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { advances } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const driverId = searchParams.get('driver_id');

  if (driverId) {
    const all = await db
      .select()
      .from(advances)
      .where(eq(advances.driver_id, parseInt(driverId, 10)))
      .orderBy(desc(advances.date));
    return NextResponse.json(all);
  }

  const all = await db.select().from(advances).orderBy(desc(advances.date));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driver_id, amount, date, reason } = body;

    if (!driver_id || !amount || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [advance] = await db
      .insert(advances)
      .values({
        driver_id: parseInt(driver_id, 10),
        amount: parseFloat(amount),
        date,
        reason,
        status: 'outstanding',
      })
      .returning();

    return NextResponse.json(advance, { status: 201 });
  } catch (err) {
    console.error('POST /api/advances error:', err);
    return NextResponse.json({ error: 'Failed to create advance' }, { status: 500 });
  }
}
