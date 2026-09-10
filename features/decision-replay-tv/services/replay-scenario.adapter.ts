import { inferReplayTvEventKind } from '@/features/decision-replay-tv/services/replay-tv-boundary.service';
import { getEducationalCandles } from '@/features/decision-replay-tv/services/replay-tv-path.service';
import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import {
  replayConcealsCompetency,
  replayPracticeDifficulty,
} from '@/features/decision-replay/services/replay-practice-difficulty.service';
import {
  REPLAY_SCENARIO_SCHEMA_VERSION,
  REPLAY_TIMESTAMP_HONESTY,
  type ReplayEventCategory,
  type ReplayHistoricalEvent,
  type ReplayLicenseKind,
  type ReplayNewsMeta,
  type ReplayScenarioPackage,
} from '@/features/decision-replay/types/replay-scenario.types';

const EVENT_KIND_TO_CATEGORY: Record<NonNullable<ReplayTvEpisode['eventKind']>, ReplayEventCategory> = {
  earnings: 'earnings',
  rate_decision: 'central_bank',
  inflation: 'inflation',
  employment: 'employment',
  geopolitical: 'geopolitical',
  company: 'other',
  liquidity: 'volatility',
  none: 'other',
};

const SKILL_TO_CONCEPT: Record<string, string> = {
  invalidation: 'invalidation',
  thesis_quality: 'thesis',
  risk: 'position-sizing',
  patience: 'discipline',
  event_risk: 'event-risk',
  earnings: 'earnings-events',
  structure: 'chart-interpretation',
  crowd: 'fomo',
  plan: 'following-a-plan',
  gap_risk: 'volatility-aware-risk',
  macro: 'event-risk',
  attention: 'discipline',
  regime: 'trend-identification',
  binary_event: 'event-risk',
  time_budget: 'discipline',
  uncertainty: 'uncertainty',
};

function licenseFor(episode: ReplayTvEpisode): ReplayLicenseKind {
  if (episode.license) return episode.license;
  if (episode.dataKind === 'sample' || episode.dataKind === 'mock') return 'educational_sample';
  return 'synthetic';
}

function categoryFor(episode: ReplayTvEpisode): ReplayEventCategory {
  const kind = inferReplayTvEventKind(episode) ?? 'none';
  return EVENT_KIND_TO_CATEGORY[kind] ?? 'other';
}

export function conceptIdsForReplayEpisode(episode: ReplayTvEpisode): string[] {
  if (episode.conceptIds?.length) return [...episode.conceptIds];
  const mapped = episode.skills.map((skill) => SKILL_TO_CONCEPT[skill] ?? skill);
  return [...new Set(mapped)];
}

export function toReplayScenarioPackage(episode: ReplayTvEpisode): ReplayScenarioPackage {
  const bars = getEducationalCandles(episode).map((bar) => ({
    timestamp: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));
  const freeze = episode.checkpoints[0]?.freezeIndex ?? Math.floor(bars.length * 0.4);
  const cutoffBar = bars[Math.min(bars.length - 1, freeze)];
  const cutoffTimestamp = cutoffBar?.timestamp ?? 0;
  const eventCategory = categoryFor(episode);

  const news: ReplayNewsMeta[] = episode.availableNews.map((item) => {
    const bar = bars[Math.min(bars.length - 1, Math.max(0, item.availableAtIndex))];
    const ts = bar?.timestamp ?? cutoffTimestamp;
    return {
      id: item.id,
      timestamp: ts,
      availableAtTimestamp: ts,
      headline: item.headline,
      summary: item.detail,
    };
  });

  const events: ReplayHistoricalEvent[] = news.map((item) => ({
    id: `evt_${item.id}`,
    timestamp: item.timestamp,
    availableAtTimestamp: item.availableAtTimestamp,
    category: eventCategory,
    headline: item.headline,
    detail: item.summary,
    outcome: undefined,
  }));

  return {
    schemaVersion: REPLAY_SCENARIO_SCHEMA_VERSION,
    instrument: {
      symbol: episode.symbol,
      name: episode.symbolLabel,
      assetClass: episode.markets[0] ?? 'other',
    },
    timeframe: episode.interval,
    decisionTimestamp: cutoffTimestamp,
    informationCutoff: cutoffTimestamp,
    bars,
    indicatorSpecs: [
      { id: 'sma-5', kind: 'sma', period: 5 },
      { id: 'rsi-8', kind: 'rsi', period: 8 },
    ],
    events,
    news,
    meta: {
      id: episode.id,
      title: episode.title,
      teaser: episode.teaser,
      eraLabel: episode.eraLabel,
      practiceDifficulty: replayPracticeDifficulty(episode),
      concealCompetency: replayConcealsCompetency(episode),
      conceptIds: conceptIdsForReplayEpisode(episode),
      license: licenseFor(episode),
      dataKind: episode.dataKind,
      provenanceNote: episode.provenanceNote,
      timestampFidelity: 'educational',
      timestampHonestyNote: REPLAY_TIMESTAMP_HONESTY,
      themes: episode.collectionIds.slice(),
    },
    reveal: {
      historicalOutcome: episode.historicalOutcome,
      teachingNotes: episode.checkpoints.map((item) => item.teachingNote),
      laterEventOutcomes: [],
    },
  };
}
