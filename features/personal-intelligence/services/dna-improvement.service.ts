import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type {
  DnaFocusPractice,
  DnaProcessInsight,
  LongitudinalTrend,
  TradingDnaProfile,
  TradingDnaTraitId,
  TradingDnaTraitScore,
} from '../types/personal-intelligence.types';
import { primaryPracticeForTrait } from './dna-coaching-actions.service';
import { formatWhyBullets, formatWhySummary } from './dna-evidence.service';

const IMPROVING_OBSERVATION: Partial<Record<TradingDnaTraitId, string>> = {
  invalidationDiscipline: 'Showing signs of improvement: defining invalidation before committing.',
  patience: 'Showing signs of improvement: waiting more often when evidence is incomplete.',
  evidenceDiscipline: 'Showing signs of improvement: collecting structure evidence before deepening research.',
  confirmationResistance: 'Showing signs of improvement: committing less often just to gather extra confirmation.',
  decisionStamina: 'Showing signs of improvement: closing more loops instead of opening extra symbols.',
  uncertaintyHandling: 'Showing signs of improvement: naming uncertainty instead of forcing a call.',
  researchEfficiency: 'Showing signs of improvement: research blocks staying more purposeful.',
  adaptability: 'Showing signs of improvement: revising the case when evidence changes.',
  reflectionQuality: 'Showing signs of improvement: closing more research loops with a written process note.',
  processConsistency: 'Showing signs of improvement: brief → research or skip → journal cadence is steadier.',
};

const DEVELOPING_HABIT: Partial<Record<TradingDnaTraitId, string>> = {
  invalidationDiscipline: 'Naming invalidation before the next bar',
  patience: 'Waiting when confirmation is missing',
  evidenceDiscipline: 'Collecting structure evidence first',
  confirmationResistance: 'Stopping extra confirmation once evidence is enough',
  decisionStamina: 'Finishing one loop before opening another',
  uncertaintyHandling: 'Leaving mixed tapes undecided',
  researchEfficiency: 'Keeping the research budget tight',
  adaptability: 'Updating the case when evidence changes',
  reflectionQuality: 'Closing loops in the journal',
};

const PRACTICE_ACTIONS: DecisionRecord['action'][] = [
  'replay_completed',
  'checklist_done',
  'journaled',
  'lab_closed',
];

function observationForTrait(trait: TradingDnaTraitScore): string {
  if (trait.insightSentence) return trait.insightSentence;
  if (trait.longitudinalTrend === 'improving') {
    return IMPROVING_OBSERVATION[trait.id] ?? `${trait.label} is strengthening versus your earlier window.`;
  }
  return `Observed tendency: ${trait.label.toLowerCase()} is the quieter growth edge — not a diagnosis.`;
}

function countRecentPractice(records: DecisionRecord[], sinceMs: number): number {
  return records.filter((r) => PRACTICE_ACTIONS.includes(r.action) && r.createdAt >= sinceMs).length;
}

function measurementFor(
  trait: TradingDnaTraitScore,
  recentPractice: number,
): { change: LongitudinalTrend; measurement: string } {
  const change = trait.longitudinalTrend;
  if (change === 'insufficient' || trait.status !== 'scored') {
    return {
      change: 'insufficient',
      measurement:
        recentPractice > 0
          ? 'Practice is in the Decision Log, but there is not yet enough comparable history to measure change.'
          : 'Not enough Decision Log events yet to measure whether this habit is changing.',
    };
  }
  if (change === 'improving') {
    return {
      change,
      measurement:
        'This habit is stronger than 30–90 days ago. Later Decision Log events show the practice landing.',
    };
  }
  if (change === 'declining') {
    return {
      change,
      measurement:
        'This habit has softened versus your earlier window. Keep the same practice — we measure later log events, not intent.',
    };
  }
  return {
    change: 'stable',
    measurement:
      recentPractice > 0
        ? 'Logged practice has not yet moved this habit versus 30 days ago. One more Replay, Academy, Journal, or Mentor loop is the next measurement.'
        : 'Stable versus your earlier window. A Replay, Academy, Journal, or Mentor exercise creates the next measurement.',
  };
}

function withInsight(trait: TradingDnaTraitScore): TradingDnaTraitScore {
  const whyBullets = trait.whyBullets?.length ? trait.whyBullets : formatWhyBullets(trait.evidence);
  if (trait.status !== 'scored') {
    return { ...trait, whyBullets };
  }
  if (trait.longitudinalTrend !== 'improving') {
    return { ...trait, whyBullets };
  }
  const insightSentence = IMPROVING_OBSERVATION[trait.id];
  return insightSentence ? { ...trait, insightSentence, whyBullets } : { ...trait, whyBullets };
}

export function buildDnaProcessInsights(dna: TradingDnaProfile): DnaProcessInsight[] {
  return dna.traits
    .filter((t) => t.status === 'scored' && t.insightSentence)
    .slice(0, 3)
    .map((t) => {
      const whyBullets = t.whyBullets?.length ? t.whyBullets : formatWhyBullets(t.evidence);
      return {
        id: `insight-${t.id}`,
        traitId: t.id,
        observation: t.insightSentence as string,
        whySummary: t.whySummary || formatWhySummary(t.evidence),
        whyBullets,
        evidence: t.evidence,
      };
    });
}

export function buildDevelopingHabits(dna: TradingDnaProfile): string[] {
  const strengthIds = new Set(
    dna.traits
      .filter((t) => t.status === 'scored' && t.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3)
      .map((t) => t.id),
  );
  return dna.traits
    .filter(
      (t) =>
        t.status === 'scored' &&
        t.longitudinalTrend === 'improving' &&
        !strengthIds.has(t.id) &&
        (t.score ?? 0) < 72,
    )
    .slice(0, 3)
    .map((t) => DEVELOPING_HABIT[t.id] ?? t.label);
}

export function buildDnaFocusPractices(input: {
  dna: TradingDnaProfile;
  records: DecisionRecord[];
  nowMs: number;
}): DnaFocusPractice[] {
  const monthAgo = input.nowMs - 30 * 86_400_000;
  const recentPractice = countRecentPractice(input.records, monthAgo);
  const growth = [...input.dna.traits]
    .filter((t) => t.status === 'scored' && t.score != null)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 2);

  const practices: DnaFocusPractice[] = [];
  for (const trait of growth) {
    const practice = primaryPracticeForTrait(trait.id);
    if (!practice) continue;
    const measured = measurementFor(trait, recentPractice);
    practices.push({
      traitId: trait.id,
      observation: observationForTrait(trait),
      practice,
      change: measured.change,
      measurement: measured.measurement,
    });
  }
  return practices;
}

/**
 * Attach longitudinal insights, developing habits, and focus → practice → measure
 * using the existing Decision Log. Does not write storage.
 */
export function attachDnaImprovement(input: {
  dna: TradingDnaProfile;
  records: DecisionRecord[];
  nowMs: number;
}): TradingDnaProfile {
  const traits = input.dna.traits.map(withInsight);
  const next: TradingDnaProfile = { ...input.dna, traits };
  const processInsights = buildDnaProcessInsights(next);
  const developingHabits = buildDevelopingHabits(next);
  const focusPractices = buildDnaFocusPractices({
    dna: next,
    records: input.records,
    nowMs: input.nowMs,
  });
  return {
    ...next,
    processInsights,
    developingHabits,
    focusPractices,
    focusAreas: focusPractices.length
      ? focusPractices.map((item) => item.observation)
      : next.focusAreas,
  };
}
