import { getDataFreshness } from '@/features/markets/constants/freshness';
import { EVIDENCE_LEVEL_COPY } from '@/shared/constants/trust-language';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiEvidenceLevel, EvidencePack } from '../types/ai-trust.types';

export function evidenceLevelLabel(level: AiEvidenceLevel): string {
  return EVIDENCE_LEVEL_COPY[level].label;
}

/**
 * Map coverage + freshness + conflict to a qualitative level.
 * Never treat this as P(price up).
 */
export function resolveAiEvidenceLevel(input: {
  context?: AiEnrichedContext | null;
  evidence?: EvidencePack | null;
  conflictingPillars?: number;
}): AiEvidenceLevel {
  const context = input.context;
  const items = input.evidence?.items ?? [];
  const present = items.filter((i) => i.present).length;
  const total = items.length;
  const coverage = total > 0 ? present / total : 0;
  const freshness = getDataFreshness(context?.assembledAt);
  const hasQuote = Boolean(context?.quote?.price);
  const conflicts = input.conflictingPillars ?? 0;

  if (!context || (!hasQuote && present === 0 && !context.symbol)) {
    return 'insufficient';
  }
  if (!hasQuote && coverage < 0.25) return 'insufficient';
  if (freshness === 'stale' || freshness === 'unknown') {
    if (coverage < 0.5) return 'insufficient';
    return 'limited';
  }
  if (conflicts >= 4 || coverage < 0.4) return 'limited';
  if (coverage >= 0.7 && (freshness === 'live' || freshness === 'recent') && conflicts <= 1 && hasQuote) {
    return 'high';
  }
  if (coverage >= 0.45) return 'moderate';
  return 'limited';
}

export function downgradeEvidenceLevel(
  level: AiEvidenceLevel,
  steps = 1,
): AiEvidenceLevel {
  const order: AiEvidenceLevel[] = ['high', 'moderate', 'limited', 'insufficient'];
  const idx = Math.min(order.length - 1, order.indexOf(level) + Math.max(1, steps));
  return order[idx] ?? 'insufficient';
}
