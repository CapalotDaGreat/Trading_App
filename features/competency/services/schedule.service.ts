import type { ConceptImportance, EvidenceDifficulty, EvidenceQuality } from '../types/competency.types';

const DAY = 24 * 60 * 60 * 1000;

const BASE_DAYS: Record<ConceptImportance, number> = {
  core: 14,
  supporting: 21,
  specialist: 28,
};

/**
 * Interval depends on importance, consistency, recent performance, and difficulty.
 * A weak concept returns sooner. A consistently strong concept returns later.
 */
export function computeRedemonstrationDueAt(input: {
  lastIndependentSuccessAt: number;
  importance: ConceptImportance;
  quality: EvidenceQuality;
  strength: number | null;
  lastDifficulty: EvidenceDifficulty;
  independentCount: number;
}): number {
  let days = BASE_DAYS[input.importance];
  const consistency = input.quality.consistency;
  const strength = input.strength ?? 0;

  if (strength < 75 || (consistency != null && consistency < 60)) {
    days = Math.round(days * 0.55);
  } else if (input.independentCount >= 5 && strength >= 85 && (consistency ?? 0) >= 85) {
    days = Math.round(days * 1.45);
  }

  if (input.lastDifficulty === 'complex') days += 4;
  if (input.lastDifficulty === 'foundations') days -= 3;
  if ((input.quality.variety ?? 50) < 40) days = Math.round(days * 0.7);

  days = Math.max(7, Math.min(45, days));
  return input.lastIndependentSuccessAt + days * DAY;
}
