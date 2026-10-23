import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = 'Back',
  className,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-semibold text-moss hover:text-ink hover:bg-mist/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600 group select-none',
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
};
