import React from 'react';
import { cn } from '@/lib/cn';
import { AuditCriterion, EvidenceItem } from '@/lib/domain/types';
import { EvidenceChip } from './EvidenceChip';

interface EvidenceRowProps {
  criterion: AuditCriterion;
  allEvidence: EvidenceItem[];
  onSelectEvidence: (item: EvidenceItem) => void;
  className?: string;
}

export const EvidenceRow: React.FC<EvidenceRowProps> = ({
  criterion,
  allEvidence,
  onSelectEvidence,
  className,
}) => {
  const matchedEvidence = allEvidence.filter((e) =>
    criterion.evidence_refs.includes(e.ref)
  );

  const score = criterion.score ?? 0;
  const isInsufficient = criterion.insufficient_evidence;

  return (
    <div
      className={cn(
        'py-4 border-b border-hairline last:border-b-0 flex flex-col gap-2.5',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[15px] text-ink">{criterion.name}</span>
          <span className="text-xs text-moss font-mono">({criterion.weight}%)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Score bar */}
          <div className="w-28 sm:w-36 h-2 rounded-full bg-mist overflow-hidden relative">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-base',
                isInsufficient ? 'bg-moss/30' : 'bg-verdant-600'
              )}
              style={{ width: `${isInsufficient ? 20 : score}%` }}
            />
          </div>
          <span className="text-sm font-semibold font-mono tabular-nums text-ink w-8 text-right">
            {isInsufficient ? '—' : score}
          </span>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-[14px] text-moss leading-normal">
        {isInsufficient ? 'Not enough evidence to score this.' : criterion.rationale}
      </p>

      {/* Evidence Chips */}
      {matchedEvidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {matchedEvidence.map((ev) => (
            <EvidenceChip
              key={ev.ref}
              evidence={ev}
              onClick={() => onSelectEvidence(ev)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
