import type {
  JournalPsychologyPoint,
  JournalPsychologyTrends,
} from '@/features/journal/types/journal-learning-journey.types';
import type { JournalEntry, TradeEmotion } from '@/features/journal/types/journal.types';

const STRESS: TradeEmotion[] = ['fearful', 'fomo', 'greedy'];

function weekKey(ms: number): string {
  const d = new Date(ms);
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset));
  return monday.toISOString().slice(0, 10);
}

function modeEmotion(emotions: TradeEmotion[]): TradeEmotion | null {
  if (!emotions.length) return null;
  const counts = new Map<TradeEmotion, number>();
  for (const e of emotions) counts.set(e, (counts.get(e) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/**
 * Psychology trends from emotional tags — process identity, never P&L grades.
 */
export function buildJournalPsychologyTrends(
  entries: JournalEntry[],
  nowMs = Date.now(),
): JournalPsychologyTrends {
  const tagged = entries.filter((e) => Boolean(e.emotion));
  const emotions = tagged.map((e) => e.emotion!).filter(Boolean);
  const dominantEmotion = modeEmotion(emotions);
  const stressCount = emotions.filter((e) => STRESS.includes(e)).length;
  const stressShare = emotions.length ? Math.round((stressCount / emotions.length) * 100) : 0;

  const buckets = new Map<string, TradeEmotion[]>();
  for (let i = 5; i >= 0; i -= 1) {
    const key = weekKey(nowMs - i * 7 * 86_400_000);
    buckets.set(key, []);
  }
  for (const entry of tagged) {
    const t = Date.parse(entry.tradedAt || entry.createdAt);
    if (Number.isNaN(t) || t < nowMs - 42 * 86_400_000) continue;
    const key = weekKey(t);
    if (!buckets.has(key)) continue;
    buckets.get(key)!.push(entry.emotion!);
  }

  const weeklyPoints: JournalPsychologyPoint[] = [...buckets.entries()].map(([key, list]) => {
    const stress = list.filter((e) => STRESS.includes(e)).length;
    return {
      key,
      label: new Date(key).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      stressShare: list.length ? Math.round((stress / list.length) * 100) : 0,
      dominantEmotion: modeEmotion(list),
      taggedCount: list.length,
    };
  });

  const narrative =
    tagged.length === 0
      ? 'Tag emotions on journals to unlock psychology trends — honesty beats hindsight.'
      : stressShare >= 50
        ? `Stress states (${dominantEmotion ?? 'mixed'}) show up often. Slow research when fear/FOMO/greed tags cluster.`
        : dominantEmotion === 'confident'
          ? 'Confidence tags dominate — pair them with written invalidation so confidence stays process-backed.'
          : `Emotional tags lean ${dominantEmotion ?? 'neutral'}. Keep labeling honestly after skips and research alike.`;

  const improvementHint =
    stressShare >= 50
      ? 'Next week: one Why-Not note before any deep research when emotion ≥ FOMO/fear.'
      : tagged.length < 5
        ? 'Aim to tag emotion on every closed decision for two weeks.'
        : 'Protect the calm weeks — journal what kept process clean.';

  return {
    narrative,
    dominantEmotion,
    stressShare,
    weeklyPoints,
    improvementHint,
  };
}
