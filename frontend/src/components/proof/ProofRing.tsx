import React, { useId } from 'react';
import { cn } from '@/lib/cn';
import { levelFor, SkillLevel, DEFAULT_PASS_MARK } from '@/lib/scoring';
import { useCountUp } from '@/lib/useCountUp';
import { Check } from 'lucide-react';

export type ProofRingState = 'verified' | 'not-verified' | 'under-review' | 'loading';
export type ProofRingSize = 56 | 96 | 160 | 240;

export interface ProofRingProps {
  score: number | null;
  skill: string;
  state: ProofRingState;
  size?: ProofRingSize;
  level?: SkillLevel;
  animate?: boolean;
  showCaption?: boolean;
  passMark?: number;
  className?: string;
}

export function buildProofRingCaption(
  state: ProofRingState,
  score: number | null,
  level: SkillLevel,
  passMark: number
): string {
  if (state === 'loading') return 'Assessing…';
  if (state === 'under-review') return 'Under human review';
  if (state === 'verified') {
    return `Verified · ${level}`;
  }
  const scoreVal = score ?? 0;
  const pointsToGo = Math.max(1, passMark - scoreVal + 1);
  return `Not verified yet · ${pointsToGo} points to go`;
}

export function buildProofRingAriaLabel(
  skill: string,
  score: number | null,
  level: SkillLevel,
  state: ProofRingState
): string {
  if (state === 'loading') return `${skill}, assessment in progress`;
  if (state === 'under-review') return `${skill}, score ${score} of 100, under human review`;
  if (state === 'verified') return `${skill}, score ${score} of 100, ${level}, verified`;
  return `${skill}, score ${score} of 100, ${level}, not verified`;
}

export const ProofRing: React.FC<ProofRingProps> = ({
  score,
  skill,
  state,
  size = 96,
  level: propLevel,
  animate = true,
  showCaption = true,
  passMark = DEFAULT_PASS_MARK,
  className,
}) => {
  const gradientId = useId();
  const level = propLevel || levelFor(score);
  const numericScore = score ?? 0;
  const displayedScore = useCountUp(numericScore, 900, animate && state !== 'loading');

  const ariaLabel = buildProofRingAriaLabel(skill, score, level, state);
  const caption = buildProofRingCaption(state, score, level, passMark);

  // Scaled dimensions
  const strokeWidth = (size / 240) * 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc length (score / 100 of circumference)
  const arcLength = (displayedScore / 100) * circumference;
  const strokeDashoffset = circumference - arcLength;

  // Center text size scaling
  const fontSize = Math.max(14, Math.round((size / 240) * 64));
  const captionSize = Math.max(10, Math.round((size / 240) * 14));
  const sealSize = Math.round((size / 240) * 40);

  if (state === 'loading') {
    return (
      <div
        className={cn('relative inline-flex flex-col items-center justify-center', className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={ariaLabel}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E3E8E5"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-hairline border-t-verdant-700 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative inline-flex flex-col items-center select-none', className)}
      style={{ width: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A1A" />
              <stop offset="30%" stopColor="#FFB470" />
              <stop offset="60%" stopColor="#8FE0B2" />
              <stop offset="100%" stopColor="#0E9F5B" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E3E8E5"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Pass mark tick at 50% (at 6 o'clock rotated by -90deg is at 180deg) */}
          <circle
            cx={size / 2}
            cy={size / 2 + radius}
            r={Math.max(1.5, strokeWidth / 3)}
            fill="#5B6A62"
          />

          {/* Active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={
              state === 'not-verified'
                ? '#FF7A1A'
                : state === 'under-review'
                ? '#FFB470'
                : `url(#${gradientId})`
            }
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeDashoffset-anim="true"
            strokeDasharray-dash={state === 'under-review' ? '6 4' : undefined}
            fill="none"
            style={{
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="font-display font-semibold text-ink tabular-nums leading-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            {displayedScore}
          </span>
          {size >= 160 && (
            <span
              className="font-medium text-moss mt-1 leading-tight"
              style={{ fontSize: `${captionSize}px` }}
            >
              {level}
            </span>
          )}
        </div>

        {/* Verified tick on ring top-right */}
        {state === 'verified' && size >= 96 && (
          <div
            className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 animate-in zoom-in-75 duration-180 motion-reduce:transform-none flex items-center justify-center rounded-full bg-verdant-600 text-white shadow-xs border-2 border-canvas"
            style={{ width: sealSize, height: sealSize }}
            title="Verified skill"
          >
            <Check className="w-3/5 h-3/5 stroke-[3]" />
          </div>
        )}
      </div>

      {showCaption && size <= 160 && (
        <span className="text-[12px] text-moss mt-1.5 text-center font-medium">
          {caption}
        </span>
      )}
    </div>
  );
};
