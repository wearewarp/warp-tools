import {
  FileText,
  ClipboardCheck,
  FileCheck,
  Receipt,
  Shield,
  BookOpen,
  Globe,
  Weight,
  Truck,
  File,
} from 'lucide-react';
import type { DocType } from '@/db/schema';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<DocType, React.ElementType> = {
  bol: FileText,
  pod: ClipboardCheck,
  rate_confirmation: FileCheck,
  invoice: Receipt,
  insurance_cert: Shield,
  authority_letter: BookOpen,
  customs_declaration: Globe,
  weight_certificate: Weight,
  lumper_receipt: Truck,
  other: File,
};

const COLOR_MAP: Record<DocType, string> = {
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

interface DocTypeIconProps {
  docType: DocType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DocTypeIcon({ docType, size = 'md', className }: DocTypeIconProps) {
  const Icon = ICON_MAP[docType] ?? File;
  const colors = COLOR_MAP[docType] ?? 'text-slate-400 bg-slate-400/10';

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4.5 w-4.5',
    lg: 'h-5.5 w-5.5',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg flex-shrink-0',
        sizeClasses[size],
        colors,
        className
      )}
    >
      <Icon className={cn('h-4 w-4', size === 'sm' && 'h-3.5 w-3.5', size === 'lg' && 'h-5 w-5')} />
    </div>
  );
}
