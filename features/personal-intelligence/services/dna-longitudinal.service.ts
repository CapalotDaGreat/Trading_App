import type { LongitudinalTrend, TradingDnaProfile } from '../types/personal-intelligence.types';
import { buildObservedTendencies } from './dna-observed-tendencies.service';
import {
  buildTradingDnaTraits,
  type DnaTraitsInput,
} from './trading-dna-traits.service';

const DAY_MS = 86_400_000;

export function longitudinalTrendFromScores(
  current: number | null,
  score90dAgo: number | null,
  score30dAgo: number | null,
): LongitudinalTrend {
  if (current == null) return 'insufficient';
  const baseline = score90dAgo ?? score30dAgo;
  if (baseline == null) return 'insufficient';
  const delta = current - baseline;
  if (delta >= 6) return 'improving';
  if (delta <= -6) return 'declining';
  return 'stable';
}

function snapshotAt(input: DnaTraitsInput, asOfMs: number): TradingDnaProfile {
  const journalEvidence = Array.isArray(input.journalEvidence)
    ? input.journalEvidence.filter((item) => item.createdAtMs <= asOfMs)
    : undefined;
  return buildTradingDnaTraits({
    memory: input.memory,
    records: input.records.filter((r) => r.createdAt <= asOfMs),
    journalEvidence,
    processScoreWeek: input.processScoreWeek,
    nowMs: asOfMs,
    mentorStruggles: input.mentorStruggles,
  });
}

/**
 * Current DNA plus 30d / 90d / all-time snapshots from the same event spine.
 * Historical windows omit current heatmap/journal-coach so present-day aggregates cannot leak backward.
 */
export function composeTradingDna(input: DnaTraitsInput): TradingDnaProfile {
  const now = input.nowMs ?? Date.now();
  const current = buildTradingDnaTraits({ ...input, nowMs: now });
  const at30 = snapshotAt(input, now - 30 * DAY_MS);
  const at90 = snapshotAt(input, now - 90 * DAY_MS);
  const allTime = buildTradingDnaTraits({
    ...input,
    nowMs: now,
    evidenceSinceMs: 0,
  });

  current.traits = current.traits.map((trait) => {
    const s30 = at30.traits.find((t) => t.id === trait.id);
    const s90 = at90.traits.find((t) => t.id === trait.id);
    const sAll = allTime.traits.find((t) => t.id === trait.id);
    const score30dAgo = s30?.status === 'scored' ? s30.score : null;
    const score90dAgo = s90?.status === 'scored' ? s90.score : null;
    const allTimeScore = sAll?.status === 'scored' ? sAll.score : null;
    return {
      ...trait,
      score30dAgo,
      score90dAgo,
      allTimeScore,
      longitudinalTrend: longitudinalTrendFromScores(trait.score, score90dAgo, score30dAgo),
    };
  });

  current.observedTendencies = buildObservedTendencies({
    records: input.records,
    dna: current,
    journalEvidence: input.journalEvidence,
    nowMs: now,
  });

  return current;
}
