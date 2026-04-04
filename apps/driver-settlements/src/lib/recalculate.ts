import { db } from '@/db';
import { settlements, trips, settlementDeductions, settlementReimbursements, advances } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';

/**
 * Recalculate and persist settlement totals from constituent records.
 */
export async function recalculateSettlement(settlementId: number): Promise<void> {
  const [tripsResult] = await db
    .select({ total: sum(trips.pay_amount) })
    .from(trips)
    .where(eq(trips.settlement_id, settlementId));

  const [deductionsResult] = await db
    .select({ total: sum(settlementDeductions.amount) })
    .from(settlementDeductions)
    .where(eq(settlementDeductions.settlement_id, settlementId));

  const [reimbursementsResult] = await db
    .select({ total: sum(settlementReimbursements.amount) })
    .from(settlementReimbursements)
    .where(eq(settlementReimbursements.settlement_id, settlementId));

  const [advancesResult] = await db
    .select({ total: sum(advances.amount) })
    .from(advances)
    .where(eq(advances.settlement_id, settlementId));

  const gross = Math.round((Number(tripsResult?.total ?? 0)) * 100) / 100;
  const totalDeductions = Math.round((Number(deductionsResult?.total ?? 0)) * 100) / 100;
  const totalReimbursements = Math.round((Number(reimbursementsResult?.total ?? 0)) * 100) / 100;
  const totalAdvances = Math.round((Number(advancesResult?.total ?? 0)) * 100) / 100;
  const netPay = Math.round((gross - totalDeductions - totalAdvances + totalReimbursements) * 100) / 100;

  await db
    .update(settlements)
    .set({
      gross_earnings: gross,
      total_deductions: totalDeductions,
      total_reimbursements: totalReimbursements,
      total_advances: totalAdvances,
      net_pay: netPay,
      updated_at: new Date().toISOString(),
    })
    .where(eq(settlements.id, settlementId));
}
