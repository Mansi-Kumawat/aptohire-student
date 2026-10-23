// Mirror of app_config. Keep in sync.
export const DEFAULT_PASS_MARK = 50;
export const DEFAULT_BORDERLINE_RANGE: [number, number] = [40, 60];

export type SkillLevel = 'Emerging' | 'Competent' | 'Proficient' | 'Advanced';

export function levelFor(score: number | null | undefined): SkillLevel {
  if (score === null || score === undefined || score < 51) {
    return 'Emerging';
  }
  if (score <= 69) {
    return 'Competent';
  }
  if (score <= 84) {
    return 'Proficient';
  }
  return 'Advanced';
}

/**
 * Checks if a score is verified.
 * Rule: strictly ABOVE the pass mark (> passMark), never >=.
 */
export function isVerified(
  score: number | null | undefined,
  passMark = DEFAULT_PASS_MARK
): boolean {
  if (score === null || score === undefined) return false;
  return score > passMark;
}

/**
 * Checks if a score falls within the borderline human-review window [low, high].
 */
export function isBorderline(
  score: number | null | undefined,
  range = DEFAULT_BORDERLINE_RANGE
): boolean {
  if (score === null || score === undefined) return false;
  return score >= range[0] && score <= range[1];
}

export function confidenceLabel(
  confidence: number | null | undefined
): 'High' | 'Medium' | 'Low' {
  // TODO(decision): Confidence thresholds: >= 0.75 High, >= 0.5 Medium, else Low
  if (confidence === null || confidence === undefined) return 'Low';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}
