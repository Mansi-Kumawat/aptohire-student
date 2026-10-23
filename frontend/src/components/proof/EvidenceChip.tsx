import React from 'react';
import { cn } from '@/lib/cn';
import { EvidenceItem } from '@/lib/domain/types';
import { Video, FileCode, FileText, Globe } from 'lucide-react';

interface EvidenceChipProps {
  evidence: EvidenceItem;
  onClick: () => void;
  className?: string;
}

export const EvidenceChip: React.FC<EvidenceChipProps> = ({
  evidence,
  onClick,
  className,
}) => {
  const getIcon = () => {
    switch (evidence.kind) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-verdant-700 shrink-0" />;
      case 'repo':
      case 'file':
        return <FileCode className="w-3.5 h-3.5 text-moss shrink-0" />;
      case 'doc':
        return <FileText className="w-3.5 h-3.5 text-moss shrink-0" />;
      case 'live':
        return <Globe className="w-3.5 h-3.5 text-verdant-700 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium',
        'bg-mist hover:bg-verdant-50 text-ink border border-hairline hover:border-verdant-300',
        'transition-colors duration-fast select-none min-h-[32px]',
        className
      )}
    >
      {getIcon()}
      <span className="truncate max-w-[180px]">{evidence.label}</span>
    </button>
  );
};
