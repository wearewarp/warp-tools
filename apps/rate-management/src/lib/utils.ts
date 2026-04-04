import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  EquipmentType,
  RateBasis,
  RateType,
  RFQStatus,
  TariffStatus,
  LaneStatus,
} from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Equipment Type ────────────────────────────────────────────────────────────

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  sprinter_van: 'Sprinter Van',
  cargo_van: 'Cargo Van',
  power_only: 'Power Only',
};

export function getEquipmentLabel(type: EquipmentType): string {
  return EQUIPMENT_LABELS[type] ?? type;
}

const EQUIPMENT_COLORS: Record<EquipmentType, string> = {
  dry_van: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  reefer: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  flatbed: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  step_deck: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  lowboy: 'text-red-400 bg-red-400/10 border-red-400/20',
  sprinter_van: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  cargo_van: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  power_only: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export function getEquipmentColor(type: EquipmentType): string {
  return EQUIPMENT_COLORS[type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Rate Basis ────────────────────────────────────────────────────────────────

const RATE_BASIS_LABELS: Record<RateBasis, string> = {
  per_mile: 'Per Mile',
  flat: 'Flat',
  per_cwt: 'Per CWT',
  per_pallet: 'Per Pallet',
};

export function getRateBasisLabel(basis: RateBasis): string {
  return RATE_BASIS_LABELS[basis] ?? basis;
}

// ─── Rate Type ─────────────────────────────────────────────────────────────────

const RATE_TYPE_LABELS: Record<RateType, string> = {
  spot: 'Spot',
  contract: 'Contract',
};

export function getRateTypeLabel(type: RateType): string {
  return RATE_TYPE_LABELS[type] ?? type;
}

const RATE_TYPE_COLORS: Record<RateType, string> = {
  spot: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  contract: 'text-green-400 bg-green-400/10 border-green-400/20',
};

export function getRateTypeColor(type: RateType): string {
  return RATE_TYPE_COLORS[type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── RFQ Status ────────────────────────────────────────────────────────────────

const RFQ_STATUS_LABELS: Record<RFQStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  responses: 'Responses In',
  awarded: 'Awarded',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export function getRFQStatusLabel(status: RFQStatus): string {
  return RFQ_STATUS_LABELS[status] ?? status;
}

const RFQ_STATUS_COLORS: Record<RFQStatus, string> = {
  draft: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  sent: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  responses: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  awarded: 'text-green-400 bg-green-400/10 border-green-400/20',
  expired: 'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export function getRFQStatusColor(status: RFQStatus): string {
  return RFQ_STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Tariff Status ─────────────────────────────────────────────────────────────

const TARIFF_STATUS_LABELS: Record<TariffStatus, string> = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
};

export function getTariffStatusLabel(status: TariffStatus): string {
  return TARIFF_STATUS_LABELS[status] ?? status;
}

const TARIFF_STATUS_COLORS: Record<TariffStatus, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/20',
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  expired: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function getTariffStatusColor(status: TariffStatus): string {
  return TARIFF_STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Lane Status ──────────────────────────────────────────────────────────────

const LANE_STATUS_LABELS: Record<LaneStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export function getLaneStatusLabel(status: LaneStatus): string {
  return LANE_STATUS_LABELS[status] ?? status;
}

export function getLaneStatusColor(status: LaneStatus): string {
  const colors: Record<LaneStatus, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    inactive: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };
  return colors[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Margin Calculation ────────────────────────────────────────────────────────

/**
 * Calculate gross margin percentage.
 * margin = (tariffRate - carrierRate) / tariffRate * 100
 */
export function calculateMargin(tariffRate: number, carrierRate: number): number {
  if (tariffRate <= 0) return 0;
  return ((tariffRate - carrierRate) / tariffRate) * 100;
}

export function getMarginColor(margin: number): string {
  if (margin >= 20) return 'text-green-400';
  if (margin >= 10) return 'text-yellow-400';
  return 'text-red-400';
}

export function getMarginLabel(margin: number): string {
  if (margin >= 20) return 'Healthy';
  if (margin >= 10) return 'Moderate';
  return 'Thin';
}
