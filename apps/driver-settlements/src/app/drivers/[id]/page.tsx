export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { drivers, trips, advances } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { DriverDetailClient } from './DriverDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverDetailPage({ params }: PageProps) {
  const { id } = await params;
  const driverId = parseInt(id, 10);

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));
  if (!driver) notFound();

  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [driverTrips, driverAdvances, tripStatsArr, advanceStatsArr] = await Promise.all([
    db.select().from(trips).where(eq(trips.driver_id, driverId)).orderBy(desc(trips.trip_date)),
    db.select().from(advances).where(eq(advances.driver_id, driverId)).orderBy(desc(advances.date)),
    db
      .select({
        total_trips: sql<number>`count(*)`,
        ytd_earnings: sql<number>`sum(case when ${trips.trip_date} >= ${yearStart} then ${trips.pay_amount} else 0 end)`,
        ytd_trips: sql<number>`count(case when ${trips.trip_date} >= ${yearStart} then 1 end)`,
        total_miles: sql<number>`sum(coalesce(${trips.miles}, 0))`,
      })
      .from(trips)
      .where(eq(trips.driver_id, driverId)),
    db
      .select({
        outstanding_advances: sql<number>`sum(case when ${advances.status} = 'outstanding' then ${advances.amount} else 0 end)`,
      })
      .from(advances)
      .where(eq(advances.driver_id, driverId)),
  ]);

  const tripStats = tripStatsArr[0] ?? { total_trips: 0, ytd_earnings: 0, ytd_trips: 0, total_miles: 0 };
  const advStats = advanceStatsArr[0] ?? { outstanding_advances: 0 };

  return (
    <DriverDetailClient
      driver={driver}
      initialTrips={driverTrips}
      initialAdvances={driverAdvances}
      stats={{
        total_trips: tripStats.total_trips ?? 0,
        ytd_earnings: tripStats.ytd_earnings ?? 0,
        ytd_trips: tripStats.ytd_trips ?? 0,
        total_miles: tripStats.total_miles ?? 0,
        outstanding_advances: advStats.outstanding_advances ?? 0,
      }}
    />
  );
}
