import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DocType } from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  bol: 'Bill of Lading',
  pod: 'Proof of Delivery',
  rate_confirmation: 'Rate Confirmation',
  invoice: 'Invoice',
  insurance_cert: 'Insurance Certificate',
  authority_letter: 'Authority Letter',
  customs_declaration: 'Customs Declaration',
  weight_certificate: 'Weight Certificate',
  lumper_receipt: 'Lumper Receipt',
  other: 'Other',
};

export function getDocTypeLabel(docType: DocType): string {
  return DOC_TYPE_LABELS[docType] ?? docType;
}

const DOC_TYPE_COLORS: Record<DocType, string> = {
  bol: 'text-blue-400 bg-blue-400/10',
  pod: 'text-green-400 bg-green-400/10',
  rate_confirmation: 'text-purple-400 bg-purple-400/10',
  invoice: 'text-yellow-400 bg-yellow-400/10',
  insurance_cert: 'text-orange-400 bg-orange-400/10',
  authority_letter: 'text-cyan-400 bg-cyan-400/10',
  customs_declaration: 'text-pink-400 bg-pink-400/10',
  weight_certificate: 'text-indigo-400 bg-indigo-400/10',
  lumper_receipt: 'text-teal-400 bg-teal-400/10',
  other: 'text-slate-400 bg-slate-400/10',
};

export function getDocTypeColor(docType: DocType): string {
  return DOC_TYPE_COLORS[docType] ?? 'text-slate-400 bg-slate-400/10';
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
