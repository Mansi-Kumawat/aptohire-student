import React from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'flex items-center justify-between gap-4 min-h-[44px] py-1 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {(label || description) && (
        <div className="flex flex-col pr-2">
          {label && <span className="text-[15px] font-medium text-ink">{label}</span>}
          {description && <span className="text-[13px] text-moss">{description}</span>}
        </div>
      )}

      <div className="relative inline-flex items-center shrink-0">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-fast bg-hairline peer-checked:bg-verdant-700',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-verdant-700 peer-focus-visible:ring-offset-2'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-fast shadow-sm',
            checked && 'translate-x-5'
          )}
        />
      </div>
    </label>
  );
};
