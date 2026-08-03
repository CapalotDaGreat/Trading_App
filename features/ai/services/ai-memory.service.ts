import { loadTraderMemory } from '@/features/decision/services/trader-intelligence.service';

import type { AiLearningMemory } from '../types/ai-trust.types';

/**
 * Privacy-safe AI learning memory — process traits only.
 * No email, name, or account identifiers.
 */
export async function buildAiLearningMemory(): Promise<AiLearningMemory> {
  const memory = await loadTraderMemory();
  const dna = memory.dna;

  const strongest =
    dna?.bestConditions?.length
      ? dna.bestConditions.slice(0, 4)
      : memory.favoriteAssets.slice(0, 4);
  const weakest =
    dna?.avoidConditions?.length
      ? dna.avoidConditions.slice(0, 4)
      : memory.weakestSetups.slice(0, 4);

  const learningStyleHint = (() => {
    const style = (dna?.styleLabel ?? memory.tradingStyle).toLowerCase();
    if (style.includes('swing')) {
      return 'Prefers multi-day structure reviews with written invalidation.';
    }
    if (style.includes('day') || style.includes('intra')) {
      return 'Prefers short checklists and fast regime confirmation.';
    }
    return 'Prefers structured research with checklist discipline.';
  })();

  const journalConsistencyHint =
    memory.notes.length >= 3
      ? 'Journal notes are accumulating — coach signals can stay personal.'
      : 'Journal depth is still light — more process notes improve personalization.';

  const replayBehaviourHint =
    (dna?.psychologyPatterns?.length ?? 0) > 0
      ? 'Replay/psychology patterns are present in DNA — keep reflecting after sessions.'
      : 'Complete Decision Replay reflections to deepen behavioural memory.';

  return {
    favoriteSetups: (dna?.bestSetups?.length ? dna.bestSetups : memory.bestSetups).slice(0, 5),
    learningStyleHint,
    strongestMarkets: strongest,
    weakestMarkets: weakest,
    preferredIndicators: (
      dna?.preferredIndicators?.length ? dna.preferredIndicators : memory.favoriteIndicators
    ).slice(0, 6),
    commonMistakes: (
      dna?.commonMistakes?.length ? dna.commonMistakes : memory.typicalMistakes
    ).slice(0, 5),
    riskTolerance: memory.riskTolerance,
    journalConsistencyHint,
    replayBehaviourHint,
    psychologyReminder:
      dna?.psychologyPatterns?.[0] ??
      memory.typicalMistakes[0] ??
      'Protect process over P&L — write invalidation first.',
    updatedAt: memory.updatedAt || Date.now(),
  };
}
