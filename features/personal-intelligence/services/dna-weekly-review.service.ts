import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type {
  DnaBehaviourPattern,
  DnaWeeklyReview,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';
import { countActions } from './dna-evidence.service';

export function buildDnaWeeklyReview(input: {
  dna: TradingDnaProfile;
  records: DecisionRecord[];
  patterns: DnaBehaviourPattern[];
  academyNextTitle?: string | null;
  nowMs?: number;
}): DnaWeeklyReview {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const weekEvents =
    countActions(input.records, 'researched', weekAgo) +
    countActions(input.records, 'journaled', weekAgo) +
    countActions(input.records, 'skipped', weekAgo) +
    countActions(input.records, 'replay_completed', weekAgo);

  const improved = input.dna.traits
    .filter((t) => t.status === 'scored' && t.trend === 'up')
    .map((t) => t.label);
  const declined = input.dna.traits
    .filter((t) => t.status === 'scored' && t.trend === 'down')
    .map((t) => t.label);

  const growthPatterns = input.patterns.filter((p) => p.tone === 'growth').map((p) => p.title);
  const strengthPatterns = input.patterns.filter((p) => p.tone === 'strength').map((p) => p.title);

  const repeated = growthPatterns.slice(0, 2);
  const practise = [
    ...input.dna.growthEdges.slice(0, 2).map((edge) => `Practise ${edge.toLowerCase()} deliberately once.`),
    input.academyNextTitle ? `Learn: ${input.academyNextTitle}` : null,
  ].filter((x): x is string => Boolean(x));

  const stopDoing = [
    growthPatterns.includes('Entering research too quickly')
      ? 'Opening a fourth symbol before journaling or skipping.'
      : null,
    growthPatterns.includes('Over-researching lower-value ideas')
      ? 'Deep research on low research-value ideas.'
      : null,
    declined.includes('FOMO Resistance') ? 'Acting on urgency without an evidence gate.' : null,
  ].filter((x): x is string => Boolean(x));

  const learn = [
    input.academyNextTitle ?? 'One Academy lesson mapped to your growth edge.',
    'One Replay focused on invalidation or patience.',
  ];

  const hasEnoughEvidence = weekEvents >= 3 || improved.length + declined.length > 0;

  return {
    improved: improved.length ? improved : hasEnoughEvidence ? strengthPatterns.slice(0, 2) : [],
    declined,
    repeated: repeated.length ? repeated : hasEnoughEvidence ? ['Keep closing research → journal loops'] : [],
    practise: hasEnoughEvidence ? practise.slice(0, 3) : ['Log a few research, skip, or journal actions this week.'],
    stopDoing: hasEnoughEvidence ? stopDoing.slice(0, 2) : [],
    learn: hasEnoughEvidence ? learn : ['Build enough process evidence for a weekly coaching review.'],
    summary: hasEnoughEvidence
      ? `This week: ${improved[0] ?? 'steady process'} leading; focus practice on ${input.dna.growthEdges[0] ?? 'reflection'}.`
      : 'Not enough evidence yet for a full weekly review.',
    hasEnoughEvidence,
  };
}
