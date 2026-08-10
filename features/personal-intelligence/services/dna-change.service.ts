import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type { DnaChangeInsight, TradingDnaProfile } from '../types/personal-intelligence.types';
import { countActions } from './dna-evidence.service';

/**
 * "What's changing?" — compare the user to themselves, never to others.
 */
export function buildDnaChangeInsights(input: {
  dna: TradingDnaProfile;
  records: DecisionRecord[];
  nowMs?: number;
}): DnaChangeInsight[] {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthAgo = now - 30 * 86_400_000;
  const insights: DnaChangeInsight[] = [];

  for (const trait of input.dna.traits) {
    if (trait.status !== 'scored' || trait.score == null || trait.previousScore == null) continue;
    const delta = trait.score - trait.previousScore;
    if (Math.abs(delta) < 6) continue;
    insights.push({
      id: `trait-${trait.id}`,
      title:
        delta > 0
          ? `${trait.label} improved over the recent window.`
          : `${trait.label} softened versus your prior window.`,
      detail:
        trait.evidence.length > 0
          ? `Supported by ${trait.evidence
              .slice(0, 3)
              .map((e) => `${e.count} ${e.label}`)
              .join(', ')}.`
          : trait.detail,
      traitId: trait.id,
      trend: trait.trend,
    });
  }

  const researchedWeek = countActions(input.records, 'researched', weekAgo);
  const researchedOlder = input.records.filter(
    (r) => r.action === 'researched' && r.createdAt >= monthAgo && r.createdAt < weekAgo,
  ).length;
  const journaledWeek = countActions(input.records, 'journaled', weekAgo);

  if (researchedWeek > 0 && researchedWeek < researchedOlder && journaledWeek >= researchedWeek * 0.5) {
    insights.push({
      id: 'more-selective',
      title: 'You are becoming more selective.',
      detail: 'Fewer research opens with more closed loops — attention is concentrating.',
      trend: 'up',
    });
  }

  if (researchedWeek >= 2 && researchedWeek <= Math.max(2, researchedOlder - 1) && journaledWeek >= 2) {
    insights.push({
      id: 'higher-value-focus',
      title: 'You are researching fewer assets but spending more care on decisions.',
      detail: 'Volume is down while reflection is holding — a process-quality shift.',
      trend: 'up',
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'gathering',
      title: 'Still gathering comparable evidence.',
      detail: 'Change detection needs enough process events across two windows.',
      trend: 'flat',
    });
  }

  return insights.slice(0, 5);
}
