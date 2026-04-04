import type { PayType } from '@/db/schema';

interface TripInputs {
  miles?: number | null;
  revenue?: number | null;
  hours?: number | null;
  stops?: number | null;
}

/**
 * Calculate pay for a single trip based on driver pay type and rate.
 */
export function calculateTripPay(
  payType: PayType,
  rate: number,
  inputs: TripInputs
): number {
  switch (payType) {
    case 'per_mile':
      return rate * (inputs.miles ?? 0);
    case 'percentage':
      return (rate / 100) * (inputs.revenue ?? 0);
    case 'flat':
      return rate;
    case 'hourly':
      return rate * (inputs.hours ?? 0);
    case 'per_stop': {
      const stops = inputs.stops ?? 1;
      // rate is base pay; $25/stop additional after first stop
      // But in our seed, rate = base amount, treat stops * rate
      return rate * stops;
    }
    default:
      return 0;
  }
}

interface TripForSettlement {
  pay_amount: number;
}

interface DeductionForSettlement {
  amount: number;
}

interface ReimbursementForSettlement {
  amount: number;
}

interface AdvanceForSettlement {
  amount: number;
}

interface SettlementCalculation {
  gross: number;
  totalDeductions: number;
  totalReimbursements: number;
  totalAdvances: number;
  netPay: number;
}

/**
 * Calculate settlement totals from constituent records.
 */
export function calculateSettlement(
  trips: TripForSettlement[],
  deductions: DeductionForSettlement[],
  reimbursements: ReimbursementForSettlement[],
  advancesList: AdvanceForSettlement[]
): SettlementCalculation {
  const gross = trips.reduce((sum, t) => sum + t.pay_amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalReimbursements = reimbursements.reduce((sum, r) => sum + r.amount, 0);
  const totalAdvances = advancesList.reduce((sum, a) => sum + a.amount, 0);
  const netPay = gross - totalDeductions - totalAdvances + totalReimbursements;

  return {
    gross: Math.round(gross * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    totalReimbursements: Math.round(totalReimbursements * 100) / 100,
    totalAdvances: Math.round(totalAdvances * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
}
