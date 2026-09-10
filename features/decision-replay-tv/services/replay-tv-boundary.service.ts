import type {
  ReplayTvEpisode,
  ReplayTvFundamentalNote,
  ReplayTvInformationBoundary,
  ReplayTvNewsItem,
  ReplayTvRevealBeat,
  ReplayTvSession,
  ReplayTvTopic,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import type { Candle } from '@/shared/types/market';

import { visibleCandlesAt } from './replay-tv-path.service';

const COLLECTION_TOPICS: Partial<Record<ReplayTvEpisode['collectionIds'][number], ReplayTvTopic[]>> = {
  crashes: ['crash', 'bear'],
  manias: ['bubble'],
  policy: ['macro', 'rates'],
  earnings: ['earnings', 'company'],
  crypto: ['volatility'],
  regime_changes: ['reversal'],
  false_breakouts: ['failed_breakout', 'breakout'],
  psychology: ['volatility'],
  risk_management: ['correction'],
  uncertainty: ['macro'],
  patterns: ['breakout'],
  volatility: ['volatility'],
  failed_setups: ['failed_breakout'],
  patience: ['correction'],
  recoveries: ['recovery', 'bull'],
  bull_markets: ['bull'],
  corrections: ['correction', 'bear'],
  employment: ['employment', 'macro'],
  sector_rotation: ['sector_rotation'],
};

export function inferReplayTvTopics(episode: ReplayTvEpisode): ReplayTvTopic[] {
  if (episode.topics?.length) return [...new Set(episode.topics)];
  const topics = episode.collectionIds.flatMap((id) => COLLECTION_TOPICS[id] ?? []);
  return [...new Set(topics.length ? topics : (['macro'] as ReplayTvTopic[]))];
}

export function inferReplayTvEventKind(episode: ReplayTvEpisode): ReplayTvEpisode['eventKind'] {
  if (episode.eventKind) return episode.eventKind;
  if (episode.collectionIds.includes('earnings')) return 'earnings';
  if (episode.collectionIds.includes('employment')) return 'employment';
  if (episode.collectionIds.includes('policy')) return 'rate_decision';
  if (inferReplayTvTopics(episode).includes('inflation')) return 'inflation';
  if (episode.collectionIds.includes('crypto') || episode.collectionIds.includes('crashes')) return 'liquidity';
  return 'none';
}

export function replayInformationBoundary(
  episode: ReplayTvEpisode,
  session?: Pick<ReplayTvSession, 'checkpointIndex' | 'revealed' | 'phase' | 'revealCursor'>,
): ReplayTvInformationBoundary {
  const start = episode.scenarioStartIndex ?? 0;
  const firstFreeze = episode.checkpoints[0]?.freezeIndex ?? Math.floor(episode.barCount * 0.4);
  const currentFreeze =
    episode.checkpoints[session?.checkpointIndex ?? 0]?.freezeIndex ?? firstFreeze;
  const revealEnd = episode.revealWindowEndIndex ?? episode.barCount - 1;
  const revealed = Boolean(session && (session.revealed || session.phase === 'reveal'));
  return {
    scenarioStart: start,
    decisionTime: firstFreeze,
    informationCutoff: revealed ? (session?.revealCursor ?? revealEnd) : currentFreeze,
    revealWindowEnd: revealEnd,
  };
}

export function visibleFundamentalsAt(
  episode: ReplayTvEpisode,
  cutoff: number,
): ReplayTvFundamentalNote[] {
  return (episode.fundamentals ?? []).filter((item) => item.availableAtIndex <= cutoff);
}

export function visibleNewsAtCutoff(episode: ReplayTvEpisode, cutoff: number): ReplayTvNewsItem[] {
  return episode.availableNews.filter((item) => item.availableAtIndex <= cutoff);
}

export function visibleRevealBeats(
  episode: ReplayTvEpisode,
  cursor: number,
): ReplayTvRevealBeat[] {
  const beats = episode.revealBeats ?? [];
  if (beats.length) return beats.filter((beat) => beat.untilIndex <= cursor);
  return episode.checkpoints
    .filter((item) => item.freezeIndex <= cursor)
    .map((item) => ({
      untilIndex: item.freezeIndex,
      whatHappened: item.teachingNote,
    }));
}

export function candlesRespectBoundary(candles: Candle[], cutoff: number, full: Candle[]): boolean {
  const allowed = visibleCandlesAt(full, cutoff);
  const lastAllowed = allowed[allowed.length - 1]?.timestamp ?? 0;
  return candles.every((candle) => candle.timestamp <= lastAllowed);
}

export function sessionLeaksFuture(session: ReplayTvSession, episode: ReplayTvEpisode): boolean {
  const fullyOpen =
    (session.revealed || session.phase === 'reveal' || session.phase === 'coaching') &&
    (session.revealCursor ?? 0) >= (episode.revealWindowEndIndex ?? episode.barCount - 1);
  if (fullyOpen) return false;
  const boundary = replayInformationBoundary(episode, session);
  const lastVisible = session.fullCandles[boundary.informationCutoff]?.timestamp ?? 0;
  const newsLeak = visibleNewsAtCutoff(episode, boundary.informationCutoff).some(
    (item) => item.availableAtIndex > boundary.informationCutoff,
  );
  return newsLeak || session.fullCandles.slice(boundary.informationCutoff + 1).some((bar) => bar.timestamp <= lastVisible);
}
