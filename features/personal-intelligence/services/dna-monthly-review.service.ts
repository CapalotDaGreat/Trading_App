import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { TraderMemory } from '@/features/decision/types/decision.types';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { JournalCoachInsight } from '@/features/decision/types/decision.types';

import type {
  DnaJournalEvidence,
  DnaMonthlyReview,
  DnaMonthlyWindow,
  DnaPracticeLink,
  TradingDnaProfile,
  TradingDnaTraitId,
} from '../types/personal-intelligence.types';
import { buildTradingDnaTraits } from './trading-dna-traits.service';
import { countActions } from './dna-evidence.service';

function windowInsight(days: 30 | 60 | 90, activity: number, top?: string, weak?: string): string {
  if (activity < 4) return `Not enough evidence in the last ${days} days for a firm comparison.`;
  if (top && weak) return `${days}d focus: ${top} leading; ${weak} still a growth edge.`;
  if (top) return `${days}d process identity leaning toward ${top}.`;
  return `${days}d process activity is accumulating.`;
}

function evolutionFromDna(dna: TradingDnaProfile, records: DecisionRecord[], now: number, academyNextTitle?: string | null) {
  const monthAgo = now - 30 * 86_400_000;
  const improved = dna.traits
    .filter((t) => t.status === 'scored' && t.longitudinalTrend === 'improving')
    .map((t) => t.label);
  const becameInconsistent = dna.traits
    .filter((t) => t.status === 'scored' && t.longitudinalTrend === 'declining')
    .map((t) => t.label);

  const replay = countActions(records, 'replay_completed', monthAgo);
  const journaled = dna.traits.find((t) => t.id === 'reflectionQuality')?.evidence
    .filter((e) => e.source === 'journal')
    .reduce((s, e) => s + e.count, 0) ?? countActions(records, 'journaled', monthAgo);
  const learned: string[] = [];
  if (replay > 0) learned.push(`${replay} replay session${replay === 1 ? '' : 's'} this month.`);
  if (journaled > 0) learned.push(`${journaled} journal loop${journaled === 1 ? '' : 's'} closed.`);
  if (academyNextTitle) learned.push(`Academy still has a mapped next lesson: ${academyNextTitle}.`);
  if (!learned.length) learned.push('Log replay, journal, or Academy practice so monthly learning is visible.');

  const practiceNext: DnaPracticeLink[] = [
    { kind: 'replay', label: 'Replay a process episode', href: '/decision/replay-tv' },
    { kind: 'academy', label: academyNextTitle ? `Academy: ${academyNextTitle}` : 'Open Academy', href: '/academy' },
    { kind: 'journal', label: 'Write a short reflection', href: '/journal' },
  ];

  return { improved, becameInconsistent, learned, practiceNext };
}

/**
 * Monthly self-comparison across 30 / 60 / 90 days. Never compares to other traders.
 */
export function buildDnaMonthlyReview(input: {
  memory: TraderMemory;
  records: DecisionRecord[];
  heatmapScores?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  journalEvidence?: DnaJournalEvidence[] | null;
  processScoreWeek?: number;
  academyNextTitle?: string | null;
  nowMs?: number;
  dna?: TradingDnaProfile;
}): DnaMonthlyReview {
  const now = input.nowMs ?? Date.now();
  const windows: DnaMonthlyWindow[] = ([30, 60, 90] as const).map((days) => {
    const since = now - days * 86_400_000;
    const slice = input.records.filter((r) => r.createdAt >= since);
    const journalSlice = Array.isArray(input.journalEvidence)
      ? input.journalEvidence.filter((j) => j.createdAtMs >= since)
      : undefined;
    const dna = buildTradingDnaTraits({
      memory: input.memory,
      records: slice,
      heatmapScores: input.heatmapScores,
      journalCoach: input.journalCoach,
      journalEvidence: journalSlice,
      processScoreWeek: input.processScoreWeek,
      nowMs: now,
    });
    const scored = dna.traits.filter((t) => t.status === 'scored' && t.score != null);
    const traitAverages = Object.fromEntries(
      scored.map((t) => [t.id, t.score as number]),
    ) as Partial<Record<TradingDnaTraitId, number>>;
    const top = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.label;
    const weak = [...scored].sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0]?.label;
    return {
      days,
      label: `${days} days`,
      traitAverages,
      activityCount: slice.length,
      insight: windowInsight(days, slice.length, top, weak),
    };
  });

  const w30 = windows[0];
  const w90 = windows[2];
  const patience30 = w30.traitAverages.patience;
  const patience90 = w90.traitAverages.patience;
  let comparison = 'Not enough evidence yet to compare monthly windows.';
  if (w30.activityCount >= 4 && w90.activityCount >= 6) {
    if (patience30 != null && patience90 != null && patience30 - patience90 >= 6) {
      comparison = 'Across 90 days, patience is rising versus your longer baseline.';
    } else if (
      (w30.traitAverages.researchEfficiency ?? 0) > (w90.traitAverages.researchEfficiency ?? 0) + 5
    ) {
      comparison = 'Recent research efficiency looks stronger than your 90-day baseline.';
    } else {
      comparison = 'You are comparing your process to your own 30 / 60 / 90 day baselines — not to others.';
    }
  }

  const composed = input.dna;
  const evolution = composed
    ? evolutionFromDna(composed, input.records, now, input.academyNextTitle)
    : {
        improved: [] as string[],
        becameInconsistent: [] as string[],
        learned: [
          'Log replay, journal, or Academy practice so monthly learning is visible.',
        ],
        practiceNext: [
          { kind: 'replay' as const, label: 'Replay a process episode', href: '/decision/replay-tv' },
          { kind: 'academy' as const, label: 'Open Academy', href: '/academy' },
          { kind: 'journal' as const, label: 'Write a short reflection', href: '/journal' },
        ],
      };

  return {
    windows,
    comparison,
    hasEnoughEvidence: w30.activityCount >= 4 || w90.activityCount >= 6,
    improved: evolution.improved,
    becameInconsistent: evolution.becameInconsistent,
    learned: evolution.learned,
    practiceNext: evolution.practiceNext,
  };
}
