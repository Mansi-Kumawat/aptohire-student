import { describe, it, expect } from 'vitest';
import { levelFor, isVerified, isBorderline, confidenceLabel } from '@/lib/scoring';
import { buildProofRingAriaLabel, buildProofRingCaption } from '@/components/proof/ProofRing';

describe('Scoring Logic', () => {
  it('correctly maps scores to levels across thresholds', () => {
    expect(levelFor(0)).toBe('Emerging');
    expect(levelFor(30)).toBe('Emerging');
    expect(levelFor(50)).toBe('Emerging');
    expect(levelFor(51)).toBe('Competent');
    expect(levelFor(69)).toBe('Competent');
    expect(levelFor(70)).toBe('Proficient');
    expect(levelFor(84)).toBe('Proficient');
    expect(levelFor(85)).toBe('Advanced');
    expect(levelFor(100)).toBe('Advanced');
  });

  it('verifies scores strictly ABOVE the pass mark (score > passMark)', () => {
    const passMark = 50;
    expect(isVerified(49, passMark)).toBe(false);
    expect(isVerified(50, passMark)).toBe(false); // At pass mark is NOT verified
    expect(isVerified(51, passMark)).toBe(true);  // Strictly above is verified
    expect(isVerified(75, passMark)).toBe(true);
    expect(isVerified(null, passMark)).toBe(false);
    expect(isVerified(undefined, passMark)).toBe(false);
  });

  it('identifies borderline range [40, 60] correctly', () => {
    expect(isBorderline(39)).toBe(false);
    expect(isBorderline(40)).toBe(true);
    expect(isBorderline(50)).toBe(true);
    expect(isBorderline(60)).toBe(true);
    expect(isBorderline(61)).toBe(false);
  });

  it('computes confidence label accurately', () => {
    expect(confidenceLabel(0.85)).toBe('High');
    expect(confidenceLabel(0.75)).toBe('High');
    expect(confidenceLabel(0.6)).toBe('Medium');
    expect(confidenceLabel(0.5)).toBe('Medium');
    expect(confidenceLabel(0.4)).toBe('Low');
  });

  it('builds accessible ProofRing aria-label and caption', () => {
    const aria = buildProofRingAriaLabel('React', 72, 'Proficient', 'verified');
    expect(aria).toBe('React, score 72 of 100, Proficient, verified');

    const captionVerified = buildProofRingCaption('verified', 72, 'Proficient', 50);
    expect(captionVerified).toBe('Verified · Proficient');

    const captionNotVerified = buildProofRingCaption('not-verified', 42, 'Emerging', 50);
    expect(captionNotVerified).toBe('Not verified yet · 9 points to go');

    const captionReview = buildProofRingCaption('under-review', 52, 'Competent', 50);
    expect(captionReview).toBe('Under human review');
  });
});
