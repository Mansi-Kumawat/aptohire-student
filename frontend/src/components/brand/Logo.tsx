import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 28, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 267 267"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none inline-block', className)}
      aria-hidden="true"
    >
      <g transform="translate(0, 267) scale(0.1, -0.1)">
        {/* Light Mint Accent under arrow */}
        <path
          d="M1649 749 c-52 -71 -103 -144 -113 -162 l-19 -33 34 -65 c19 -37 46 -89 62 -118 l27 -51 199 0 c108 0 200 3 204 6 3 4 -11 39 -33 78 -69 126 -129 239 -167 316 -21 41 -41 77 -44 80 -3 3 -14 19 -23 37 -9 17 -20 34 -25 37 -5 3 -51 -53 -102 -125z"
          fill="#A4E2BE"
          stroke="none"
        />
        {/* Dark Emerald Arrow & Loop */}
        <path
          d="M2430 2331 c-12 -7 -267 -107 -688 -271 l-43 -16 111 -79 c60 -43 110 -82 110 -87 0 -5 -41 -66 -92 -136 -50 -70 -108 -150 -127 -178 -232 -330 -484 -680 -528 -733 -24 -30 -62 -68 -84 -84 -174 -128 -418 -67 -510 128 -24 50 -29 73 -29 137 0 101 26 171 88 237 69 73 145 106 247 105 75 0 128 -16 205 -61 3 -2 50 58 104 132 76 105 95 139 87 149 -6 7 -44 30 -84 50 -296 150 -659 70 -852 -188 -105 -141 -140 -246 -140 -421 0 -126 20 -217 67 -310 60 -117 185 -240 304 -299 81 -40 224 -76 304 -76 81 0 227 37 313 79 130 63 197 133 394 408 431 604 606 849 614 857 4 5 58 -28 121 -72 101 -73 113 -79 115 -59 1 12 7 164 13 337 6 173 13 348 17 388 6 75 1 84 -37 63z"
          fill="#037449"
          stroke="none"
        />
      </g>
    </svg>
  );
};

interface SealMarkProps {
  size?: number;
  className?: string;
}

export const SealMark: React.FC<SealMarkProps> = ({ size = 20, className }) => {
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
  const markSize = size === 'lg' ? 36 : size === 'sm' ? 24 : 30;

  if (collapsed) {
    return (
      <div className={cn('flex items-center justify-center select-none', className)} title="AptoHire">
        <LogoMark size={markSize} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <LogoMark size={markSize} />
      <div className="flex items-baseline gap-1.5">
        <span className="font-display font-bold text-[22px] tracking-tight text-ink leading-none">
          <span>AptoH</span>
          <span className="inline-block relative">
            <span
              className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#037449]"
              aria-hidden="true"
            />
            <span>ı</span>
          </span>
          <span>re</span>
        </span>
        {showPortalBadge && (
          <span className="text-[11px] font-semibold tracking-wide font-body text-verdant-800 px-1.5 py-0.5 rounded-full bg-verdant-50 border border-verdant-200 leading-none">
            student
          </span>
        )}
      </div>
    </div>
  );
};
