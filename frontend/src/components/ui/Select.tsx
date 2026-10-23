import React from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        <select
          ref={ref}
          className={cn(
            'w-full h-[46px] pl-4 pr-11 rounded-control bg-canvas text-ink text-[15px] font-medium border border-hairline',
            'appearance-none focus:border-verdant-700 focus:ring-2 focus:ring-verdant-700/15 focus:outline-none',
            'hover:border-moss/50 transition-all shadow-subtle cursor-pointer',
            'disabled:opacity-50 disabled:bg-mist/50 disabled:cursor-not-allowed',
            error && 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/15',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-5 h-5 rounded text-moss group-hover:text-ink transition-colors">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
