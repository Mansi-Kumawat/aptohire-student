import React from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-control transition-colors duration-fast select-none active:scale-[0.98] focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

    const variantStyles: Record<ButtonVariant, string> = {
      // Primary: white text on verdant-700
      primary: 'bg-verdant-700 text-white hover:bg-verdant-800 shadow-sm',
      // Accent: ink text on ember-500 (never white on orange)
      accent: 'bg-ember-500 text-ink hover:bg-ember-300 font-bold shadow-sm',
      // Secondary: hairline border on canvas/mist
      secondary: 'bg-canvas text-ink border border-hairline hover:bg-mist hover:text-ink',
      // Ghost
      ghost: 'bg-transparent text-ink hover:bg-mist',
      // Danger: white on danger-600
      danger: 'bg-danger-600 text-white hover:bg-red-700',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      default: 'h-[44px] md:h-[40px] px-4 text-[15px]',
      sm: 'h-[36px] px-3 text-[14px]',
      lg: 'h-[48px] px-6 text-[16px]',
      icon: 'h-[44px] w-[44px] p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
