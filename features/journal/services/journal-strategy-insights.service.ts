import type { JournalStrategyInsight } from '@/features/journal/types/journal-learning-journey.types';
import type { JournalEntry } from '@/features/journal/types/journal.types';

/**
 * Strategy insights from journal strategy/tags — process hygiene, not edge claims.
 */
export function buildJournalStrategyInsights(entries: JournalEntry[]): JournalStrategyInsight[] {
  const byStrategy = new Map<string, JournalEntry[]>();

  for (const entry of entries) {
    const key = entry.strategy?.trim() || entry.tags[0]?.trim();
    if (!key) continue;
    const list = byStrategy.get(key) ?? [];
    list.push(entry);
    byStrategy.set(key, list);
  }

  return [...byStrategy.entries()]
    .map(([strategy, list]) => {
      const withLessons = list.filter((e) => Boolean(e.lessonsLearned?.trim())).length;
      const planTagged = list.filter((e) => typeof e.planAdhered === 'boolean');
      const planOk = planTagged.filter((e) => e.planAdhered).length;
      const planAdherenceRate = planTagged.length
        ? Math.round((planOk / planTagged.length) * 100)
        : 0;
      const tip =
        withLessons / list.length < 0.4
          ? `“${strategy}” needs more lessons-learned notes to close the loop.`
          : planTagged.length > 0 && planAdherenceRate < 50
            ? `Plan drift shows up on “${strategy}” — rewrite invalidation before the next attempt.`
            : `“${strategy}” has solid process notes — reinforce with Replay TV or Academy practice.`;

      return {
        strategy,
        count: list.length,
        withLessons,
        planAdherenceRate,
        tip,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
