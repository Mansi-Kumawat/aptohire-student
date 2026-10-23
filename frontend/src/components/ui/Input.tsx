import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full h-[44px] px-3.5 rounded-control bg-canvas text-ink text-[16px] border border-hairline',
          'placeholder:text-moss/60 focus:border-verdant-700 transition-colors',
          'disabled:opacity-50 disabled:bg-mist/50 disabled:cursor-not-allowed',
          error && 'border-danger-600 focus:border-danger-600',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
