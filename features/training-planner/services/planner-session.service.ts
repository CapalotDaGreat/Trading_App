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
): number {
  if (typeof overrideMinutes === 'number' && Number.isFinite(overrideMinutes) && overrideMinutes > 0) {
    return overrideMinutes;
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
