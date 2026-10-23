import React from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, description, checked, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-3 min-h-[44px] py-1 cursor-pointer select-none group',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 shrink-0 rounded-[6px] border border-hairline bg-canvas group-hover:border-moss transition-colors">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-full h-full rounded-[5px] flex items-center justify-center transition-all',
              checked ? 'bg-verdant-700 text-white border-verdant-700' : 'bg-transparent'
            )}
          >
            {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-[15px] font-medium text-ink">{label}</span>}
            {description && <span className="text-[13px] text-moss">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
