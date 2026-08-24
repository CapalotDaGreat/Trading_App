import type {
  ReplayTvCollectionId,
  ReplayTvEpisode,
  ReplayTvEpisodeKind,
  ReplayTvMarketFocus,
} from '@/features/decision-replay-tv/types/replay-tv.types';

export type ReplayTvDifficultyFilter = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type ReplayTvMarketFilter = ReplayTvMarketFocus | 'all';
export type ReplayTvThemeFilter =
  | 'all'
  | 'macro'
  | 'patterns'
  | 'psychology'
  | 'risk'
  | 'volatility'
  | 'patience';

const KIND_FROM_COLLECTION: Partial<Record<ReplayTvCollectionId, ReplayTvEpisodeKind>> = {
  policy: 'macro_event',
  regime_changes: 'regime_transition',
  false_breakouts: 'false_breakout',
  psychology: 'patience',
  risk_management: 'risk_management',
  patterns: 'pattern',
  volatility: 'volatility',
  failed_setups: 'failed_setup',
  patience: 'patience',
};

export function inferReplayTvEpisodeKinds(episode: ReplayTvEpisode): ReplayTvEpisodeKind[] {
  if (episode.kinds?.length) return episode.kinds;
  const inferred = episode.collectionIds
    .map((id) => KIND_FROM_COLLECTION[id])
    .filter((kind): kind is ReplayTvEpisodeKind => Boolean(kind));
  return inferred.length ? [...new Set(inferred)] : ['pattern'];
}

export function matchesDifficulty(episode: ReplayTvEpisode, filter: ReplayTvDifficultyFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'beginner') return episode.difficulty === 'foundation';
  if (filter === 'intermediate') return episode.difficulty === 'intermediate';
  return episode.difficulty === 'advanced' || episode.difficulty === 'expert';
}

export function matchesMarket(episode: ReplayTvEpisode, filter: ReplayTvMarketFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'macro') return episode.markets.includes('macro') || episode.collectionIds.includes('policy');
  return episode.markets.includes(filter);
}

export function matchesTheme(episode: ReplayTvEpisode, filter: ReplayTvThemeFilter): boolean {
  if (filter === 'all') return true;
  const kinds = inferReplayTvEpisodeKinds(episode);
  switch (filter) {
    case 'macro':
      return kinds.includes('macro_event') || episode.collectionIds.includes('policy');
    case 'patterns':
      return kinds.includes('pattern') || kinds.includes('false_breakout') || episode.collectionIds.includes('patterns');
    case 'psychology':
      return episode.collectionIds.includes('psychology');
    case 'risk':
      return kinds.includes('risk_management') || episode.collectionIds.includes('risk_management');
    case 'volatility':
      return kinds.includes('volatility') || episode.collectionIds.includes('volatility');
    case 'patience':
      return (
        kinds.includes('patience') ||
        episode.inactionIsValidProcess === true ||
        episode.collectionIds.includes('patience')
      );
    default:
      return true;
  }
}

export function filterReplayTvLibrary(
  episodes: ReplayTvEpisode[],
  input: {
    difficulty?: ReplayTvDifficultyFilter;
    market?: ReplayTvMarketFilter;
    theme?: ReplayTvThemeFilter;
  },
): ReplayTvEpisode[] {
  return episodes.filter(
    (episode) =>
      matchesDifficulty(episode, input.difficulty ?? 'all') &&
      matchesMarket(episode, input.market ?? 'all') &&
      matchesTheme(episode, input.theme ?? 'all'),
  );
}
