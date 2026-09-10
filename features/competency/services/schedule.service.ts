import type { ConceptImportance, EvidenceDifficulty, EvidenceQuality } from '../types/competency.types';

const DAY = 24 * 60 * 60 * 1000;

const BASE_DAYS: Record<ConceptImportance, number> = {
  core: 14,
  supporting: 21,
  specialist: 28,
};

/** 0–100. Higher means the last independent success is more likely forgotten. */
export function forgettingRiskFromQuality(quality: EvidenceQuality): number {
  const recency = quality.recency ?? 50;
  const variety = quality.variety ?? 50;
  const consistency = quality.consistency ?? 50;
  return Math.max(0, Math.min(100, Math.round(100 - recency * 0.7 - variety * 0.15 - consistency * 0.15)));
}

/**
 * Interval depends on importance, demonstrated strength, evidence age / forgetting risk,
 * transfer weakness, and recent errors. A weak concept returns sooner.
 * A consistently strong, independently demonstrated concept returns later — still inside 7–45 days.
 */
export function computeRedemonstrationDueAt(input: {
  lastIndependentSuccessAt: number;
  importance: ConceptImportance;
  quality: EvidenceQuality;
  strength: number | null;
  lastDifficulty: EvidenceDifficulty;
  independentCount: number;
  transferProven?: boolean;
  recentFailCount?: number;
  reviewIntervalMultiplier?: number;
}): number {
  let days = BASE_DAYS[input.importance];
  const consistency = input.quality.consistency;
  const strength = input.strength ?? 0;
  const forgetting = forgettingRiskFromQuality(input.quality);
  const fails = input.recentFailCount ?? 0;

  if (strength < 75 || (consistency != null && consistency < 60)) {
    days = Math.round(days * 0.55);
  } else if (input.independentCount >= 5 && strength >= 85 && (consistency ?? 0) >= 85) {
    days = Math.round(days * 1.45);
  }

  if (input.lastDifficulty === 'complex') days += 4;
  if (input.lastDifficulty === 'foundations') days -= 3;
  if ((input.quality.variety ?? 50) < 40 || input.transferProven === false) {
    days = Math.round(days * 0.7);
  }
  if (forgetting >= 60) days = Math.round(days * 0.75);
  else if (forgetting <= 25 && strength >= 85) days = Math.round(days * 1.08);
  if (fails >= 2) days = Math.round(days * 0.6);
  else if (fails >= 1) days = Math.round(days * 0.85);
  if (input.reviewIntervalMultiplier && Number.isFinite(input.reviewIntervalMultiplier)) {
    days = Math.round(days * input.reviewIntervalMultiplier);
  }

  days = Math.max(7, Math.min(45, days));
  return input.lastIndependentSuccessAt + days * DAY;
}
