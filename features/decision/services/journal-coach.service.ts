import type { JournalEntry, TradeEmotion } from '@/features/journal/types/journal.types';

import type { JournalCoachInsight } from '../types/decision.types';
import { buildExplainability } from './explainability.service';

function modeCount<T extends string>(items: T[]): T | undefined {
  if (!items.length) return undefined;
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best: T | undefined;
  let bestN = -1;
  for (const [key, n] of counts) {
    if (n > bestN) {
      best = key;
      bestN = n;
    }
  }
  return best;
}

function emotionPsychology(emotion: TradeEmotion | undefined, lossHeavy: boolean): string {
  if (emotion === 'fearful' || emotion === 'fomo') {
    return `Recent journals show ${emotion} states — slow down entries and write invalidation first.`;
  }
  if (emotion === 'greedy' || emotion === 'confident') {
    return lossHeavy
      ? 'Confidence after mixed outcomes can hide process drift — keep size and checklist fixed.'
      : 'Confidence is useful when paired with a written invalidation and time budget.';
  }
  if (lossHeavy) {
    return 'Fear after consecutive losses can elevate stop-moves — protect process over P&L.';
  }
  return 'Maintain process discipline after wins — avoid size creep.';
}

/**
 * Process coach from journal fields — tags, emotion, strategy, lessons — not invented defaults.
 */
export function buildJournalCoach(entries: JournalEntry[]): JournalCoachInsight {
  const closed = entries.filter((e) => e.outcome !== 'open' && e.pnl !== undefined);
  const wins = closed.filter((e) => (e.pnl ?? 0) > 0);
  const losses = closed.filter((e) => (e.pnl ?? 0) < 0);
  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : 0;

  const avgWin =
    wins.length > 0 ? wins.reduce((s, e) => s + Math.abs(e.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((s, e) => s + Math.abs(e.pnl ?? 0), 0) / losses.length : 1;
  const avgRr = avgLoss > 0 ? Math.round((avgWin / avgLoss) * 10) / 10 : 0;

  const weekdayCounts = new Map<string, { w: number; t: number }>();
  for (const e of closed) {
    const day = new Date(e.tradedAt).toLocaleDateString('en-US', { weekday: 'long' });
    const cur = weekdayCounts.get(day) ?? { w: 0, t: 0 };
    cur.t += 1;
    if ((e.pnl ?? 0) > 0) cur.w += 1;
    weekdayCounts.set(day, cur);
  }
  let bestWeekday = 'Not enough closed journals yet';
  let bestRate = -1;
  for (const [day, v] of weekdayCounts) {
    const rate = v.t ? v.w / v.t : 0;
    if (rate > bestRate && v.t >= 2) {
      bestRate = rate;
      bestWeekday = day;
    }
  }

  const notesBlob = closed
    .map((e) => `${e.notes ?? ''} ${e.lessonsLearned ?? ''}`.toLowerCase())
    .join(' ');
  const movedStops = /moved stop|move stop|widened stop|chased/.test(notesBlob);
  const noPlan = /no plan|skipped checklist|impulse|fomo/.test(notesBlob);
  const mostCommonMistake = movedStops
    ? 'Moving stops after adverse moves'
    : noPlan
      ? 'Acting without a written plan or checklist'
      : losses.length > wins.length
        ? 'Entering without clear invalidation'
        : closed.length
          ? 'Watch for process drift after winning streaks'
          : 'Too few closed journals for a personal mistake pattern';

  const tagPool = closed.flatMap((e) => e.tags.map((t) => t.trim()).filter(Boolean));
  const strategyPool = closed
    .map((e) => e.strategy?.trim())
    .filter((s): s is string => Boolean(s));
  const emotionPool = closed
    .map((e) => e.emotion)
    .filter((e): e is TradeEmotion => Boolean(e));

  const dominantTag = modeCount(tagPool);
  const dominantStrategy = modeCount(strategyPool);
  const dominantEmotion = modeCount(emotionPool);

  const worstCondition = dominantTag
    ? `Tagged setups around “${dominantTag}” need extra checklist rigor`
    : losses.length
      ? 'Conditions tied to recent losses — review those journals for regime mismatch'
      : 'Not enough tagged journals to isolate a weak condition';

  const bestIndicator = dominantStrategy
    ? `Your logged edge cue: ${dominantStrategy}`
    : tagPool.length
      ? `Most common process tag: ${dominantTag}`
      : 'Log strategy/tags on journals to surface your real edge cues';

  const processScore = Math.min(
    95,
    Math.max(
      35,
      Math.round(
        (closed.length >= 5 ? 20 : closed.length * 3) +
          Math.min(avgRr, 3) * 10 +
          (movedStops ? -10 : 12) +
          (dominantEmotion === 'fearful' || dominantEmotion === 'fomo' ? -6 : 6) +
          (tagPool.length >= 3 ? 8 : 0),
      ),
    ),
  );

  const asOf = Date.now();
  return {
    winRate,
    avgRr,
    mostCommonMistake,
    bestWeekday,
    worstCondition,
    bestIndicator,
    psychology: emotionPsychology(dominantEmotion, losses.length >= 2),
    edge: dominantStrategy
      ? `${dominantStrategy} — reinforce with invalidation notes`
      : dominantTag
        ? `Process tag “${dominantTag}” shows up often — pair it with regime filters`
        : 'Momentum / structure setups once you log strategy consistently',
    avoid: noPlan
      ? 'Impulse entries without a checklist'
      : 'Research without journaling — it breaks the learning loop',
    recommendation:
      closed.length < 5
        ? 'Log more closed decisions with tags, emotion, and lessons so coaching stays personal.'
        : dominantEmotion === 'fearful' || dominantEmotion === 'fomo'
          ? 'This week: one checklist + one Why-Not note before any deep research.'
          : 'Prioritize setups that match your logged strategy; skip when tags contradict regime.',
    processScore,
    explainability: buildExplainability({
      confidence: processScore,
      factors: [
        { label: 'Sample size', agrees: closed.length >= 5, detail: `${closed.length} closed journals` },
        { label: 'Process notes', agrees: !movedStops && !noPlan, detail: movedStops || noPlan ? 'Leak language found' : 'Cleaner notes' },
        {
          label: 'Tagged process',
          agrees: tagPool.length >= 3 || Boolean(dominantStrategy),
          detail: dominantStrategy ?? dominantTag ?? 'Add tags/strategy',
        },
      ],
      dataAsOf: asOf,
      reasoning:
        'Coach insights derived from your journal tags, emotions, strategies, and lessons — process over P&L.',
    }),
  };
}
