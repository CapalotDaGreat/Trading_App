import { DRILL_TO_CONCEPT } from '@/features/competency/content/activity-concept-map';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import { ALL_LESSONS } from '../content';
import type { Lesson } from '../types/academy.types';

export type MasteryLabel = 'Not started' | 'Starting' | 'Developing' | 'Improving' | 'Strong';

export interface PathMastery {
  label: MasteryLabel;
  evidence: string;
  readRatio: number;
  practicedRatio: number;
  quizAverage: number | null;
}

export interface WeakConcept {
  conceptId: string;
  lessonId: string;
  title: string;
  misses: number;
  attempts: number;
  reason: string;
  evidence: string[];
}

export interface ConceptResult {
  attempts: number;
  misses: number;
}

/** Maps tracked concepts / drill ids onto a lesson to recommend. */
export const CONCEPT_TO_LESSON: Record<string, string> = {
  'false-breakouts': 'ta-false-breakouts',
  breakouts: 'ta-false-breakouts',
  rsi: 'ta-rsi',
  momentum: 'ta-momentum',
  macd: 'ta-macd',
  divergence: 'ta-divergence',
  'position-sizing': 'risk-position-sizing',
  'risk-per-trade': 'risk-per-trade',
  drawdown: 'risk-drawdown',
  volatility: 'foundations-volatility',
  'volatility-aware-risk': 'foundations-volatility',
  liquidity: 'foundations-liquidity',
  timeframes: 'foundations-timeframes',
  'asset-classes': 'foundations-asset-classes',
  price: 'foundations-price',
  fx: 'foundations-fx',
  'currency-pairs': 'foundations-fx',
  fomo: 'psych-fomo',
  revenge: 'psych-revenge',
  'confirmation-bias': 'psych-confirmation',
  'loss-aversion': 'psych-loss-aversion',
  overconfidence: 'psych-overconfidence',
  'recency-bias': 'psych-recency',
  discipline: 'psych-discipline',
  thesis: 'dec-thesis',
  evidence: 'dec-thesis',
  'decision-quality': 'dec-quality',
  uncertainty: 'dec-uncertainty',
  diversification: 'port-diversification',
  concentration: 'risk-exposure',
  correlation: 'risk-correlation',
  allocation: 'port-allocation',
  rebalancing: 'port-allocation',
  'risk-of-ruin': 'risk-ruin',
  stops: 'risk-stops',
  invalidation: 'risk-stops',
  'trend-identification': 'ta-trend-range',
  support: 'ta-structure',
  'revenge-trading': 'psych-revenge',
  volume: 'ta-volume',
  'moving-averages': 'ta-moving-averages',
  'event-risk': 'fund-calendar',
  inflation: 'fund-economy',
  'interest-rates': 'fund-economy',
  earnings: 'fund-statements',
  'revenue-growth': 'fund-statements',
  'balance-sheet': 'fund-statements',
  valuation: 'fund-valuation-quality',
  'competitive-position': 'fund-valuation-quality',
  'business-quality': 'fund-basics',
  'fundamental-uncertainty': 'fund-basics',
};

function lessonTitle(id: string): string {
  return ALL_LESSONS.find((lesson) => lesson.id === id)?.title ?? id;
}

export function scorePathMastery(input: {
  lessonIds: string[];
  isRead: (id: string) => boolean;
  isPracticed: (id: string) => boolean;
  quizBest?: (id: string) => number | undefined;
}): PathMastery {
  const total = input.lessonIds.length || 1;
  const read = input.lessonIds.filter((id) => input.isRead(id)).length;
  const practiced = input.lessonIds.filter((id) => input.isPracticed(id)).length;
  const readRatio = read / total;
  const practicedRatio = practiced / total;
  const quizScores = input.lessonIds
    .map((id) => input.quizBest?.(id))
    .filter((score): score is number => typeof score === 'number');
  const quizAverage = quizScores.length
    ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
    : null;

  if (read === 0 && practiced === 0) {
    return {
      label: 'Not started',
      evidence: 'No lessons read or practised on this path yet.',
      readRatio,
      practicedRatio,
      quizAverage,
    };
  }
  if (readRatio >= 0.7 && practicedRatio >= 0.5 && (quizAverage == null || quizAverage >= 70)) {
    return {
      label: 'Strong',
      evidence: `${read}/${total} read, ${practiced}/${total} practised${quizAverage != null ? `, quiz avg ${Math.round(quizAverage)}%` : ''}.`,
      readRatio,
      practicedRatio,
      quizAverage,
    };
  }
  if (practiced > 0 && practiced < read && read >= 2) {
    return {
      label: 'Improving',
      evidence: `Read ${read} lessons; practised ${practiced}. Close the loop with a drill or paper decision.`,
      readRatio,
      practicedRatio,
      quizAverage,
    };
  }
  if (readRatio < 0.25) {
    return {
      label: 'Starting',
      evidence: `${read}/${total} lessons read. Continue the path in order.`,
      readRatio,
      practicedRatio,
      quizAverage,
    };
  }
  return {
    label: 'Developing',
    evidence: `${read}/${total} read, ${practiced}/${total} practised. Keep seeing, practising, and applying.`,
    readRatio,
    practicedRatio,
    quizAverage,
  };
}

export function collectWeakConcepts(input: {
  conceptResults: Record<string, ConceptResult>;
  repeatedDrillIds: string[];
}): WeakConcept[] {
  const out: WeakConcept[] = [];
  const seenLessons = new Set<string>();

  const push = (conceptId: string, misses: number, attempts: number, extra: string) => {
    const lessonId = CONCEPT_TO_LESSON[conceptId];
    if (!lessonId || seenLessons.has(lessonId)) return;
    const lesson = ALL_LESSONS.find((item) => item.id === lessonId);
    if (!lesson) return;
    seenLessons.add(lessonId);
    out.push({
      conceptId,
      lessonId,
      title: lesson.title,
      misses,
      attempts,
      reason: `Repeated difficulty with ${conceptId.replace(/-/g, ' ')}.`,
      evidence: [
        extra,
        `Opens “${lessonTitle(lessonId)}” because that is the matching lesson — not a random pick.`,
      ],
    });
  };

  const ranked = Object.entries(input.conceptResults)
    .map(([conceptId, result]) => ({ conceptId, ...result }))
    .filter((row) => row.attempts >= 2 && row.misses >= 2 && row.misses / row.attempts >= 0.5)
    .sort((a, b) => b.misses - a.misses || b.attempts - a.attempts);

  for (const row of ranked) {
    push(row.conceptId, row.misses, row.attempts, `${row.misses} misses in ${row.attempts} academy checks.`);
  }

  for (const drillId of input.repeatedDrillIds) {
    const conceptId = DRILL_TO_CONCEPT[drillId] ?? drillId;
    const drill = PRACTICE_DRILLS.find((item) => item.id === drillId);
    push(
      conceptId,
      2,
      2,
      drill
        ? `Practice drill “${drill.title}” missed more than once.`
        : `Practice drill ${drillId} missed more than once.`,
    );
  }

  return out.slice(0, 5);
}

export function auditLessonsWithoutSimulation(lessons: Lesson[] = ALL_LESSONS): { id: string; title: string }[] {
  return lessons
    .filter((lesson) => !lesson.simulationLinks?.length && !lesson.practiceLinks.some((link) => /simulate/i.test(link.href)))
    .map((lesson) => ({ id: lesson.id, title: lesson.title }));
}
