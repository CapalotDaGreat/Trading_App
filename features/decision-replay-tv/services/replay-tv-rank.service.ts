import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { marketAffinityScore } from '@/features/onboarding/services/coach-personalisation.service';

/**
 * Soft-rank Replay TV episodes by coach markets / struggles without changing the catalog.
 */
export function rankReplayTvEpisodes(
  episodes: ReplayTvEpisode[],
  input?: {
    markets?: string[] | null;
    struggles?: string[] | null;
    completedIds?: string[];
  },
): ReplayTvEpisode[] {
  const markets = input?.markets ?? [];
  const struggles = (input?.struggles ?? []).join(' ').toLowerCase();
  const completed = new Set(input?.completedIds ?? []);

  return [...episodes].sort((a, b) => {
    const score = (ep: ReplayTvEpisode) => {
      let value = marketAffinityScore(ep.symbol, markets);
      if (markets.includes('crypto') && ep.collectionIds.includes('crypto')) value += 4;
      if (markets.includes('stocks') && ep.collectionIds.includes('earnings')) value += 2;
      if (/emotion|fomo|revenge|patience|overtrad/.test(struggles) && ep.skills.includes('invalidation')) {
        value += 3;
      }
      if (/risk|exit|plan/.test(struggles) && ep.skills.includes('time_budget')) value += 2;
      if (completed.has(ep.id)) value -= 5;
      if (ep.collectionIds.includes('featured')) value += 1;
      return value;
    };
    return score(b) - score(a);
  });
}
