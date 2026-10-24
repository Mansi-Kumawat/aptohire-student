import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface RichSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface RichSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: RichSelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  helperText?: string;
}

export const RichSelect: React.FC<RichSelectProps> = ({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option…',
  label,
  disabled,
  className,
  error,
  helperText,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-moss uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'flex items-center justify-between w-full h-[46px] px-4 rounded-xl bg-canvas text-ink text-[14.5px] font-medium border border-hairline',
            'transition-all duration-200 cursor-pointer shadow-subtle hover:border-verdant-400 hover:bg-mist/30',
            'focus:border-verdant-700 focus:ring-2 focus:ring-verdant-700/20 focus:outline-none focus:bg-canvas',
            'disabled:opacity-50 disabled:bg-mist/50 disabled:cursor-not-allowed',
            error && 'border-danger-600 focus:border-danger-600 focus:ring-danger-600/20 text-danger-600',
            className
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedOption?.icon && (
              <span className="text-verdant-700 shrink-0">{selectedOption.icon}</span>
            )}
            <SelectPrimitive.Value placeholder={placeholder}>
              {selectedOption?.label || placeholder}
            </SelectPrimitive.Value>
          </div>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="w-4 h-4 text-moss shrink-0 transition-transform duration-200" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-50 min-w-[260px] w-[var(--radix-select-trigger-width)] max-h-80 overflow-hidden rounded-2xl border border-hairline/80 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-white/90 text-moss">
              <ChevronUp className="w-4 h-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1 space-y-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-ink cursor-pointer select-none outline-none transition-all',
                    'hover:bg-verdant-50 hover:text-verdant-900 data-[highlighted]:bg-verdant-50 data-[highlighted]:text-verdant-900',
                    'data-[state=checked]:font-semibold data-[state=checked]:bg-verdant-50/90 data-[state=checked]:text-verdant-900'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                    {option.icon && <span className="text-verdant-700 shrink-0">{option.icon}</span>}
                    <div className="truncate">
                      <SelectPrimitive.ItemText>
                        <span className="block truncate font-medium text-ink">{option.label}</span>
                      </SelectPrimitive.ItemText>
                      {option.description && (
                        <p className="text-[11.5px] text-moss/90 font-normal mt-0.5 line-clamp-2">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {option.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-mist text-moss border border-hairline/70">
                        {option.badge}
                      </span>
                    )}
                    <SelectPrimitive.ItemIndicator>
                      <Check className="w-4 h-4 text-verdant-700 stroke-[2.5]" />
                    </SelectPrimitive.ItemIndicator>
                  </div>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-white/90 text-moss">
              <ChevronDown className="w-4 h-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {helperText && (
        <p className={cn('text-xs mt-1.5', error ? 'text-danger-600' : 'text-moss')}>
          {helperText}
        </p>
      )}
    </div>
  );
};
