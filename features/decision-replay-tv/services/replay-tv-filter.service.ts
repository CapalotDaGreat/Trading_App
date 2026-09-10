import { inferReplayTvEventKind, inferReplayTvTopics } from '@/features/decision-replay-tv/services/replay-tv-boundary.service';
import type {
  ReplayTvCollectionId,
  ReplayTvEpisode,
  ReplayTvEpisodeKind,
  ReplayTvEventKind,
  ReplayTvMarketFocus,
  ReplayTvProgress,
  ReplayTvTopic,
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
export type ReplayTvDurationFilter = 'all' | 'short' | 'standard' | 'long';
export type ReplayTvCompletedFilter = 'all' | 'done' | 'todo';
export type ReplayTvWeakAreaFilter = 'all' | 'breakouts' | 'risk' | 'patience' | 'uncertainty';

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

export function matchesTopic(episode: ReplayTvEpisode, topic?: ReplayTvTopic | 'all'): boolean {
  if (!topic || topic === 'all') return true;
  return inferReplayTvTopics(episode).includes(topic);
}

export function matchesEvent(episode: ReplayTvEpisode, event?: ReplayTvEventKind | 'all'): boolean {
  if (!event || event === 'all') return true;
  return inferReplayTvEventKind(episode) === event;
}

export function matchesAsset(episode: ReplayTvEpisode, asset?: string | 'all'): boolean {
  if (!asset || asset === 'all') return true;
  const needle = asset.toUpperCase();
  return episode.symbol.toUpperCase() === needle || episode.symbolLabel.toUpperCase().includes(needle);
}

export function matchesSkill(episode: ReplayTvEpisode, skill?: string | 'all'): boolean {
  if (!skill || skill === 'all') return true;
  return episode.skills.includes(skill) || episode.scoringEmphasis.includes(skill as never);
}

export function matchesDuration(episode: ReplayTvEpisode, filter: ReplayTvDurationFilter = 'all'): boolean {
  if (filter === 'all') return true;
  if (filter === 'short') return episode.durationMinutes <= 8;
  if (filter === 'standard') return episode.durationMinutes <= 15;
  return episode.durationMinutes > 15;
}

export function matchesCompleted(
  episode: ReplayTvEpisode,
  filter: ReplayTvCompletedFilter,
  completedIds: string[],
): boolean {
  if (filter === 'all') return true;
  const done = completedIds.includes(episode.id);
  return filter === 'done' ? done : !done;
}

export function matchesWeakArea(episode: ReplayTvEpisode, area: ReplayTvWeakAreaFilter): boolean {
  if (area === 'all') return true;
  const topics = inferReplayTvTopics(episode);
  if (area === 'breakouts') {
    return topics.includes('breakout') || topics.includes('failed_breakout') || episode.collectionIds.includes('false_breakouts');
  }
  if (area === 'risk') {
    return episode.collectionIds.includes('risk_management') || episode.scoringEmphasis.includes('risk');
  }
  if (area === 'patience') {
    return episode.inactionIsValidProcess === true || episode.collectionIds.includes('patience');
  }
  return topics.includes('macro') || episode.collectionIds.includes('uncertainty');
}

export function inferWeakAreaFromProgress(progress: ReplayTvProgress): ReplayTvWeakAreaFilter {
  const entries = Object.entries(progress.bestProcessByEpisode);
  if (!entries.length) return 'all';
  const weakest = [...entries].sort((a, b) => a[1] - b[1])[0];
  if (!weakest || weakest[1] >= 70) return 'all';
  return 'risk';
}

export function filterReplayTvLibrary(
  episodes: ReplayTvEpisode[],
  input: {
    difficulty?: ReplayTvDifficultyFilter;
    market?: ReplayTvMarketFilter;
    theme?: ReplayTvThemeFilter;
    topic?: ReplayTvTopic | 'all';
    event?: ReplayTvEventKind | 'all';
    asset?: string | 'all';
    skill?: string | 'all';
    duration?: ReplayTvDurationFilter;
    completed?: ReplayTvCompletedFilter;
    weakArea?: ReplayTvWeakAreaFilter;
    completedIds?: string[];
  },
): ReplayTvEpisode[] {
  return episodes.filter(
    (episode) =>
      matchesDifficulty(episode, input.difficulty ?? 'all') &&
      matchesMarket(episode, input.market ?? 'all') &&
      matchesTheme(episode, input.theme ?? 'all') &&
      matchesTopic(episode, input.topic ?? 'all') &&
      matchesEvent(episode, input.event ?? 'all') &&
      matchesAsset(episode, input.asset ?? 'all') &&
      matchesSkill(episode, input.skill ?? 'all') &&
      matchesDuration(episode, input.duration ?? 'all') &&
      matchesCompleted(episode, input.completed ?? 'all', input.completedIds ?? []) &&
      matchesWeakArea(episode, input.weakArea ?? 'all'),
  );
}
