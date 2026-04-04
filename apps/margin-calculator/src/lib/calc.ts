export type RateType = 'per-mile' | 'flat' | 'per-cwt';

export interface BasicInputs {
  rateType: RateType;
  sellRate: number;
  buyRate: number;
  miles: number;
  weight: number; // lbs, for per-cwt
}

export interface AdvancedCosts {
  fuelCost: number;
  tollCost: number;
  driverPay: number;
  deadheadMiles: number;
  deadheadRate: number;
  accessorialCost: number;
  factoringFeePercent: number;
}

export interface BasicResult {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
}

export interface AdvancedResult extends BasicResult {
  deadheadCost: number;
  factoringFee: number;
  totalAdditionalCosts: number;
  trueMargin: number;
  trueMarginPercent: number;
}

export type MarginTier = 'good' | 'ok' | 'low';

export function getMarginTier(pct: number): MarginTier {
  if (pct >= 15) return 'good';
  if (pct >= 10) return 'ok';
  return 'low';
}

export function marginColor(pct: number): string {
  if (pct >= 15) return '#00C650';
  if (pct >= 10) return '#FFAA00';
  return '#FF4444';
}

function getUnits(inputs: BasicInputs): number {
  if (inputs.rateType === 'per-mile') return inputs.miles;
  if (inputs.rateType === 'per-cwt') return inputs.weight / 100;
  return 1; // flat
}

export function calcBasic(inputs: BasicInputs): BasicResult {
  const units = getUnits(inputs);
  const revenue = inputs.sellRate * units;
  const cost = inputs.buyRate * units;
  const grossMargin = revenue - cost;
  const marginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  return { revenue, cost, grossMargin, marginPercent };
}

export function calcAdvanced(inputs: BasicInputs, adv: AdvancedCosts): AdvancedResult {
  const basic = calcBasic(inputs);
  const deadheadCost = adv.deadheadMiles * adv.deadheadRate;
  const factoringFee = basic.revenue * (adv.factoringFeePercent / 100);
  const totalAdditionalCosts =
    adv.fuelCost +
    adv.tollCost +
    adv.driverPay +
    deadheadCost +
    adv.accessorialCost +
    factoringFee;
  const trueMargin = basic.grossMargin - totalAdditionalCosts;
  const trueMarginPercent = basic.revenue > 0 ? (trueMargin / basic.revenue) * 100 : 0;
  return {
    ...basic,
    deadheadCost,
    factoringFee,
    totalAdditionalCosts,
    trueMargin,
    trueMarginPercent,
  };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}
