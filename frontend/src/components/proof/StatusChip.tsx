import React from 'react';
import { cn } from '@/lib/cn';
import { Check, CheckCircle2 } from 'lucide-react';

export type StatusChipKind =
  | 'verified'
  | 'under-review'
  | 'pending'
  | 'unverified-university'
  | 'verified-university'
  | 'verified-organization'
  | 'declined'
  | 'closed'
  | 'withdrawn'
  | 'expired'
  | 'auditing'
  | 'emerging'
  | 'competent'
  | 'proficient'
  | 'advanced';

interface StatusChipProps {
  kind: StatusChipKind;
  label?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ kind, label, className }) => {
  switch (kind) {
    case 'verified':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-verdant-100 text-verdant-800 tracking-wide',
            className
          )}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5] text-verdant-700" />
          {label || 'Verified'}
        </span>
      );

    case 'under-review':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-ember-100 text-ember-700',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-ember-500" aria-hidden="true" />
          {label || 'Under review'}
        </span>
      );

    case 'pending':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ember-50 text-ember-700',
            className
          )}
        >
          {label || 'Pending'}
        </span>
      );

    case 'unverified-university':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-canvas border border-dashed border-hairline text-moss',
            className
          )}
        >
          {label || 'Unverified'}
        </span>
      );

    case 'verified-university':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-verdant-50 text-verdant-800 border border-verdant-100',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-verdant-700" />
          {label || 'Verified university'}
        </span>
      );

    case 'verified-organization':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-verdant-50 text-verdant-800 border border-verdant-100',
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-verdant-700" />
          {label || 'Verified organization'}
        </span>
      );

    case 'auditing':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-ember-50 text-ember-700',
            className
          )}
        >
          <span
            className="w-2 h-2 rounded-full bg-ember-500 animate-ping [animation-duration:1.2s] motion-reduce:animate-none"
            aria-hidden="true"
          />
          {label || 'Auditing'}
        </span>
      );

    case 'declined':
    case 'closed':
    case 'withdrawn':
    case 'expired':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mist text-moss border border-hairline',
            className
          )}
        >
          {label || (kind.charAt(0).toUpperCase() + kind.slice(1))}
        </span>
      );

    case 'emerging':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mist text-moss',
            className
          )}
        >
          {label || 'Emerging'}
        </span>
      );

    case 'competent':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-verdant-50 text-verdant-700 border border-verdant-100',
            className
          )}
        >
          {label || 'Competent'}
        </span>
      );

    case 'proficient':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-verdant-100 text-verdant-800',
            className
          )}
        >
          {label || 'Proficient'}
        </span>
      );

    case 'advanced':
      return (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-verdant-100 text-verdant-800 border border-verdant-300',
            className
          )}
        >
          {label || 'Advanced'}
        </span>
      );

    default:
      return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-mist text-moss', className)}>
          {label || kind}
        </span>
      );
  }
};
