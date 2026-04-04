import { NextResponse } from 'next/server';
import { db } from '@/db';
import { settlements, drivers, trips, advances } from '@/db/schema';
import { eq, and, gte, lte, sum, count, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function getCurrentPeriod() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(today);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

export async function GET() {
  try {
    const period = getCurrentPeriod();

    // Settlement status counts for current period
    const allSettlements = await db
      .select({
        id: settlements.id,
        status: settlements.status,
        driver_id: settlements.driver_id,
        gross_earnings: settlements.gross_earnings,
        total_deductions: settlements.total_deductions,
        total_reimbursements: settlements.total_reimbursements,
        net_pay: settlements.net_pay,
        period_start: settlements.period_start,
        period_end: settlements.period_end,
        updated_at: settlements.updated_at,
        settlement_number: settlements.settlement_number,
      })
      .from(settlements);

    const currentPeriodSettlements = allSettlements.filter(
      (s) => s.period_start >= period.start && s.period_end <= period.end
    );

    // Also look at recent 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentStart = twoWeeksAgo.toISOString().split('T')[0];

    const recentSettlements = allSettlements.filter((s) => s.period_start >= recentStart);

    const open = recentSettlements.filter((s) => s.status === 'open').length;
    const submitted = recentSettlements.filter((s) => s.status === 'submitted').length;
    const approved = recentSettlements.filter((s) => s.status === 'approved').length;
    const paid = recentSettlements.filter((s) => s.status === 'paid').length;

    const grossTotal = recentSettlements.reduce((s, r) => s + r.gross_earnings, 0);
    const deductionsTotal = recentSettlements.reduce((s, r) => s + r.total_deductions, 0);
    const netTotal = recentSettlements.reduce((s, r) => s + r.net_pay, 0);

    // Active drivers
    const allDrivers = await db
      .select()
      .from(drivers)
      .where(eq(drivers.status, 'active'));

    // Driver status grid: match drivers to their most recent settlement
    const driverStatusGrid = allDrivers.map((d) => {
      const driverSettlements = recentSettlements
        .filter((s) => s.driver_id === d.id)
        .sort((a, b) => b.id - a.id);
      const latest = driverSettlements[0];
      return {
        driver_id: d.id,
        driver_name: `${d.first_name} ${d.last_name}`,
        pay_type: d.pay_type,
        status: latest?.status ?? null,
        gross: latest?.gross_earnings ?? 0,
        settlement_number: latest?.settlement_number ?? null,
        settlement_id: latest?.id ?? null,
      };
    });

    // Alerts
    const alerts: Array<{ type: string; message: string; driver_id?: number }> = [];

    // Drivers with no trips in recent period
    const recentTrips = await db
      .select({ driver_id: trips.driver_id })
      .from(trips)
      .where(gte(trips.trip_date, recentStart));
    const driversWithTrips = new Set(recentTrips.map((t) => t.driver_id));
    for (const d of allDrivers) {
      if (!driversWithTrips.has(d.id)) {
        alerts.push({
          type: 'no_trips',
          message: `${d.first_name} ${d.last_name} has no trips in the last 2 weeks`,
          driver_id: d.id,
        });
      }
    }

    // Overdue submitted settlements (submitted > 2 days ago)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString();
    for (const s of allSettlements.filter((s) => s.status === 'submitted')) {
      if (s.updated_at < twoDaysAgoStr) {
        alerts.push({
          type: 'overdue_submitted',
          message: `Settlement ${s.settlement_number} has been awaiting approval for over 2 days`,
        });
      }
    }

    // High outstanding advances
    const outstandingAdvances = await db
      .select()
      .from(advances)
      .where(eq(advances.status, 'outstanding'));

    const advanceByDriver = new Map<number, number>();
    for (const adv of outstandingAdvances) {
      advanceByDriver.set(adv.driver_id, (advanceByDriver.get(adv.driver_id) ?? 0) + adv.amount);
    }
    for (const [driverId, total] of advanceByDriver.entries()) {
      if (total >= 500) {
        const driver = allDrivers.find((d) => d.id === driverId);
        if (driver) {
          alerts.push({
            type: 'high_advance',
            message: `${driver.first_name} ${driver.last_name} has $${total.toFixed(2)} in outstanding advances`,
            driver_id: driverId,
          });
        }
      }
    }

    // Recent activity: last 10 settlement status changes (approximate by updated_at)
    const recentActivity = allSettlements
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 10)
      .map((s) => {
        const driver = allDrivers.find((d) => d.id === s.driver_id);
        return {
          settlement_id: s.id,
          settlement_number: s.settlement_number,
          status: s.status,
          driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown',
          updated_at: s.updated_at,
        };
      });

    return NextResponse.json({
      period,
      stats: { open, submitted, approved, paid },
      payroll: {
        gross: Math.round(grossTotal * 100) / 100,
        deductions: Math.round(deductionsTotal * 100) / 100,
        net: Math.round(netTotal * 100) / 100,
      },
      driver_status_grid: driverStatusGrid,
      alerts,
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error('GET /api/dashboard/summary error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
