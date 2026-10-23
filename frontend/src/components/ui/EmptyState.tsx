import React from 'react';
import { cn } from '@/lib/cn';
import { Button, ButtonVariant } from './Button';

export interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'accent',
  className,
  icon,
}) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-panel border border-hairline bg-mesh',
        className
      )}
    >
      <div className="relative w-16 h-16 flex items-center justify-center mb-4 select-none">
        {/* Palette circles on mesh */}
        <div className="absolute inset-0 rounded-full bg-verdant-100/60" />
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-ember-100/70" />
        <div className="relative z-10 text-ink">
          {icon || (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0E9F5B"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          )}
        </div>
      </div>

      {title && (
        <h3 className="font-display font-semibold text-lg text-ink mb-1">
          {title}
        </h3>
      )}

      <p className="text-moss text-[15px] max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
