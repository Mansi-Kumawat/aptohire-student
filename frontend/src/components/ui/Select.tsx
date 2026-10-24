import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Check } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, helperText, label, id, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract options from children
    const options: { value: string; label: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        options.push({
          value: String(child.props.value ?? ''),
          label: String(child.props.children ?? ''),
        });
      }
    });

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelectOption = (optVal: string) => {
      if (onChange) {
        // Create synthetic change event for native select compatibility
        const syntheticEvent = {
          target: { value: optVal, id, name: props.name },
          currentTarget: { value: optVal, id, name: props.name },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      setIsOpen(false);
    };

    return (
      <div className="w-full space-y-1.5" ref={containerRef}>
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-moss uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="relative w-full">
          {/* Native select element - keyboard accessible and test compatible */}
          <select
            id={id}
            ref={ref}
            value={value}
            onChange={onChange}
            onMouseDown={(e) => {
              if (options.length > 0) {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
            className={cn(
              'w-full h-[48px] pl-4 pr-10 rounded-xl bg-canvas text-ink text-[14.5px] font-medium border border-hairline',
              'transition-all duration-200 cursor-pointer shadow-subtle',
              'hover:border-verdant-400 hover:bg-mist/30',
              'focus:border-verdant-700 focus:outline-none focus:bg-canvas focus:ring-0',
              'disabled:opacity-50 disabled:bg-mist/50 disabled:cursor-not-allowed',
              error && 'border-danger-600 focus:border-danger-600 text-danger-600',
              className
            )}
            {...props}
          >
            {children}
          </select>

          {/* CUSTOM STYLED DROPDOWN OPTION LIST POPUP */}
          {isOpen && options.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-hairline/90 bg-white/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
              role="listbox"
            >
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {options.map((opt) => {
                  const isSelected = opt.value === String(value);
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(opt.value)}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer select-none transition-all',
                        isSelected
                          ? 'bg-verdant-50 text-verdant-900 font-semibold border border-verdant-200 shadow-2xs'
                          : 'text-ink hover:bg-verdant-50/60 hover:text-verdant-900'
                      )}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-verdant-700 stroke-[2.5] shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {helperText && (
          <p className={cn('text-xs mt-1.5', error ? 'text-danger-600' : 'text-moss')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
