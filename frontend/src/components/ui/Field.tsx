import React from 'react';
import { cn } from '@/lib/cn';
import { AlertCircle } from 'lucide-react';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  helperText,
  error,
  required,
  className,
  children,
}) => {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const helperId = htmlFor ? `${htmlFor}-helper` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[14px] font-medium text-ink flex items-center gap-1 select-none"
      >
        <span>{label}</span>
        {required && <span className="text-danger-600" aria-hidden="true">*</span>}
      </label>

      {children}

      {error ? (
        <p
          id={errorId}
          className="text-[14px] text-danger-600 flex items-center gap-1.5 mt-0.5"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[14px] text-moss mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
