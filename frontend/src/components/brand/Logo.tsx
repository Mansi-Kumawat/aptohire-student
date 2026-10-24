import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 28, className }) => {
  return (
    <img
      src="/aptohire-mark.png"
      alt="AptoHire"
      width={size}
      height={size}
      className={cn('shrink-0 select-none inline-block object-contain', className)}
      style={{ width: size, height: size }}
    />
  );
};

export const SealMark: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex items-center justify-center shrink-0 rounded-full bg-verdant-100 text-verdant-800',
        className
      )}
      aria-hidden="true"
    >
      <Check style={{ width: size * 0.7, height: size * 0.7 }} className="stroke-[2.5]" />
    </span>
  );
};

interface LogoProps {
  className?: string;
  showPortalBadge?: boolean;
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className,
  showPortalBadge = true,
  collapsed = false,
  size = 'md',
}) => {
  const height = size === 'lg' ? 38 : size === 'sm' ? 24 : 30;

  if (collapsed) {
    return (
      <div className={cn('flex items-center justify-center select-none shrink-0', className)} title="AptoHire">
        <img
          src="/aptohire-mark.png"
          alt="AptoHire"
          className="object-contain"
          style={{ height, width: height }}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none whitespace-nowrap shrink-0', className)}>
      <img
        src="/aptohire-logo-transparent.png"
        alt="AptoHire"
        className="object-contain w-auto select-none"
        style={{ height }}
      />
      {showPortalBadge && (
        <span className="text-[11px] font-semibold tracking-wide font-body text-verdant-800 px-1.5 py-0.5 rounded-full bg-verdant-50 border border-verdant-200 leading-none shrink-0">
          student
        </span>
      )}
    </div>
  );
};
