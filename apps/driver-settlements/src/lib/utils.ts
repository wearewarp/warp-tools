import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PayType, DriverStatus, SettlementStatus } from '@/db/schema';

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

// ─── Pay Type ─────────────────────────────────────────────────────────────────

const PAY_TYPE_LABELS: Record<PayType, string> = {
  per_mile: 'Per Mile',
  percentage: 'Percentage',
  flat: 'Flat Rate',
  hourly: 'Hourly',
  per_stop: 'Per Stop',
};

export function getPayTypeLabel(payType: PayType): string {
  return PAY_TYPE_LABELS[payType] ?? payType;
}

const PAY_TYPE_COLORS: Record<PayType, string> = {
  per_mile: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  percentage: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  flat: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  hourly: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  per_stop: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

export function getPayTypeColor(payType: PayType): string {
  return PAY_TYPE_COLORS[payType] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Settlement Status ─────────────────────────────────────────────────────────

const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  open: 'Open',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  disputed: 'Disputed',
};

export function getSettlementStatusLabel(status: SettlementStatus): string {
  return SETTLEMENT_STATUS_LABELS[status] ?? status;
}

const SETTLEMENT_STATUS_COLORS: Record<SettlementStatus, string> = {
  open: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  submitted: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  approved: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-green-400 bg-green-400/10 border-green-400/20',
  disputed: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function getSettlementStatusColor(status: SettlementStatus): string {
  return SETTLEMENT_STATUS_COLORS[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

// ─── Driver Status ─────────────────────────────────────────────────────────────

const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  terminated: 'Terminated',
};

export function getDriverStatusLabel(status: DriverStatus): string {
  return DRIVER_STATUS_LABELS[status] ?? status;
}

export function getDriverStatusColor(status: DriverStatus): string {
  const colors: Record<DriverStatus, string> = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    inactive: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    terminated: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return colors[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}
