import { NextResponse } from 'next/server';
import { db } from '@/db';
import { drivers, advances } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allDrivers = await db.select().from(drivers).where(eq(drivers.status, 'active'));
    const allAdvances = await db.select().from(advances);

    const report = allDrivers.map((driver) => {
      const driverAdvances = allAdvances.filter((a) => a.driver_id === driver.id);
      const outstanding = driverAdvances
        .filter((a) => a.status === 'outstanding')
        .reduce((s, a) => s + a.amount, 0);
      const totalAdvanced = driverAdvances.reduce((s, a) => s + a.amount, 0);
      const totalDeducted = driverAdvances
        .filter((a) => a.status === 'deducted')
        .reduce((s, a) => s + a.amount, 0);

      return {
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        outstanding: Math.round(outstanding * 100) / 100,
        total_advanced: Math.round(totalAdvanced * 100) / 100,
        total_deducted: Math.round(totalDeducted * 100) / 100,
        advance_count: driverAdvances.length,
      };
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error('GET /api/reports/advance-balance error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
