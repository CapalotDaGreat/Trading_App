import type { TrainingSessionLength } from '../types/training-planner.types';

export const SESSION_BUDGET_MINUTES: Record<TrainingSessionLength, number> = {
  quick: 10,
  normal: 20,
  deep: 45,
};

export function sessionLengthFromBudget(minutes: number | null | undefined): TrainingSessionLength {
  const value = typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : 20;
  if (value <= 12) return 'quick';
  if (value >= 40) return 'deep';
  return 'normal';
}

export function sessionBudgetMinutes(
  length: TrainingSessionLength,
  overrideMinutes?: number,
  options?: { preferLength?: boolean },
): number {
  if (!options?.preferLength) {
    if (typeof overrideMinutes === 'number' && Number.isFinite(overrideMinutes) && overrideMinutes > 0) {
      return overrideMinutes;
    }
  }
  return SESSION_BUDGET_MINUTES[length];
}

/** Fit bonus only — never a penalty for preferring short sessions. */
export function sessionFitDelta(
  estimatedMinutes: number,
  budgetMinutes: number,
  critical: boolean,
): number {
  if (critical) return 0;
  if (estimatedMinutes <= budgetMinutes) return 18;
  if (estimatedMinutes <= budgetMinutes + 8) return 4;
  return 0;
}

/**
 * Session length must change ranking, not only the Home chips.
 * Quick prefers one focused drill; deep prefers richer loop activities.
 */
export function sessionPreferenceDelta(
  estimatedMinutes: number,
  length: TrainingSessionLength,
  critical: boolean,
): number {
  if (length === 'quick') {
    if (estimatedMinutes <= 10) return critical ? 12 : 48;
    if (estimatedMinutes >= 22) return critical ? -20 : -58;
    return 0;
  }
  if (length === 'deep') {
    if (estimatedMinutes >= 18) return 42;
    if (estimatedMinutes <= 8 && !critical) return -30;
    return 0;
  }
  return 0;
}
