import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { marketAffinityScore } from '@/features/onboarding/services/coach-personalisation.service';
import type {
  MentorExperienceLevel,
  TradingStyleInterest,
} from '@/features/onboarding/types/mentor-setup.types';

const STYLE_MAP: Partial<Record<TradingStyleInterest, ReplayTvEpisode['tradingStyles'][number]>> = {
  swing: 'swing',
  day_trading: 'day',
  scalping: 'scalp',
  position: 'position',
  trend_following: 'swing',
  momentum: 'day',
};

const EXPERIENCE_DIFFICULTY: Record<
  MentorExperienceLevel,
  ReplayTvEpisode['difficulty'][]
> = {
  completely_new: ['foundation'],
  beginner: ['foundation', 'intermediate'],
  intermediate: ['foundation', 'intermediate', 'advanced'],
  advanced: ['intermediate', 'advanced', 'expert'],
  professional: ['advanced', 'expert', 'intermediate'],
};

function growthEdgeBoost(episode: ReplayTvEpisode, growthEdges: string[]): number {
  if (!growthEdges.length) return 0;
  const hay = `${episode.skills.join(' ')} ${episode.scoringEmphasis.join(' ')} ${episode.collectionIds.join(' ')}`.toLowerCase();
  let value = 0;
  for (const edge of growthEdges) {
    const token = edge.toLowerCase();
    if (!token || token.includes('gather more')) continue;
    if (hay.includes(token.replace(/\s+/g, '_')) || hay.includes(token)) value += 4;
    if (/patience|attention|fomo|emotion/.test(token) && episode.collectionIds.includes('psychology')) {
      value += 3;
    }
    if (/risk|invalidation/.test(token) && episode.collectionIds.includes('risk_management')) {
      value += 3;
    }
    if (/evidence|reflection|research/.test(token) && episode.scoringEmphasis.includes('evidence')) {
      value += 2;
    }
  }
  return value;
}

/**
 * Soft-rank Replay TV episodes by Mentor Setup + DNA growth edges.
 * Never changes catalog content — demotes completed episodes.
 */
export function rankReplayTvEpisodes(
  episodes: ReplayTvEpisode[],
  input?: {
    markets?: string[] | null;
    struggles?: string[] | null;
    styles?: string[] | null;
    experience?: MentorExperienceLevel | null;
    growthEdges?: string[] | null;
    completedIds?: string[];
  },
): ReplayTvEpisode[] {
  const markets = input?.markets ?? [];
  const struggles = (input?.struggles ?? []).join(' ').toLowerCase();
  const styles = input?.styles ?? [];
  const growthEdges = input?.growthEdges ?? [];
  const completed = new Set(input?.completedIds ?? []);
  const preferredDifficulties = input?.experience
    ? new Set(EXPERIENCE_DIFFICULTY[input.experience])
    : null;

  return [...episodes].sort((a, b) => {
    const score = (ep: ReplayTvEpisode) => {
      let value = marketAffinityScore(ep.symbol, markets);
      if (markets.includes('crypto') && ep.markets.includes('crypto')) value += 4;
      if (markets.includes('forex') && ep.markets.includes('forex')) value += 3;
      if (markets.includes('stocks') && ep.markets.includes('stocks')) value += 2;
      if (markets.includes('indices') && ep.markets.includes('macro')) value += 2;

      for (const style of styles) {
        const mapped = STYLE_MAP[style as TradingStyleInterest];
        if (mapped && ep.tradingStyles.includes(mapped)) value += 3;
      }

      if (/emotion|fomo|revenge|patience|overtrad/.test(struggles)) {
        if (ep.skills.includes('invalidation') || ep.collectionIds.includes('psychology')) value += 3;
      }
      if (/risk|exit|plan/.test(struggles)) {
        if (ep.skills.includes('time_budget') || ep.collectionIds.includes('risk_management')) {
          value += 3;
        }
      }

      value += growthEdgeBoost(ep, growthEdges);

      if (preferredDifficulties?.has(ep.difficulty)) value += 2;
      if (completed.has(ep.id)) value -= 8;
      if (ep.collectionIds.includes('featured')) value += 1;
      return value;
    };
    return score(b) - score(a);
  });
}

export function episodesForDnaGrowth(
  episodes: ReplayTvEpisode[],
  growthEdges: string[],
  completedIds: string[] = [],
): ReplayTvEpisode[] {
  return rankReplayTvEpisodes(episodes, { growthEdges, completedIds }).filter((ep) => {
    if (!growthEdges.length) return ep.difficulty === 'foundation';
    return growthEdgeBoost(ep, growthEdges) > 0;
  });
}
