import React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full p-3.5 rounded-control bg-canvas text-ink text-[16px] border border-hairline',
          'placeholder:text-moss/60 focus:border-verdant-700 transition-colors resize-y leading-relaxed',
          'disabled:opacity-50 disabled:bg-mist/50 disabled:cursor-not-allowed',
          error && 'border-danger-600 focus:border-danger-600',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
