import type { DataSourceKind } from '@/features/markets/constants/data-source';
import type { CandleInterval } from '@/shared/types/market';

/**
 * Provider-independent replay package (schemaVersion 1).
 * Not bound to a market-data vendor. Bars may be synthetic, licensed, or labelled sample.
 */
export const REPLAY_SCENARIO_SCHEMA_VERSION = 1 as const;

export type ReplayLicenseKind = 'synthetic' | 'licensed_historical' | 'educational_sample';

/**
 * How honest the timestamps are.
 * Catalog rooms are educational reconstructions — never imply tick-accurate vendor data.
 */
export type ReplayTimestampFidelity = 'educational' | 'tick_accurate';

export type ReplayInformationLayer = 'historical' | 'later' | 'educational_metadata';

export const REPLAY_TIMESTAMP_HONESTY =
  'Timestamps are educational (session-level reconstructions), not tick-accurate market data.';

export const REPLAY_CORE_QUESTION =
  'How would you have reasoned with the information available at that exact point?';

/** Practice level shown in the library. Mixed rooms conceal the competency under test. */
export type ReplayPracticeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

export type ReplayEventCategory =
  | 'volatility'
  | 'earnings'
  | 'central_bank'
  | 'inflation'
  | 'employment'
  | 'crash'
  | 'recovery'
  | 'false_breakout'
  | 'trend_change'
  | 'regime_shift'
  | 'geopolitical'
  | 'other';

export interface ReplayBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ReplayInstrument {
  symbol: string;
  name: string;
  assetClass: string;
}

export interface ReplayHistoricalEvent {
  id: string;
  /** When the event occurs on the tape. */
  timestamp: number;
  /** First moment the user may know it existed. Never later than timestamp. */
  availableAtTimestamp: number;
  category: ReplayEventCategory;
  headline: string;
  detail: string;
  /** Hidden until reveal. */
  outcome?: string;
}

export interface ReplayNewsMeta {
  id: string;
  timestamp: number;
  availableAtTimestamp: number;
  headline: string;
  summary: string;
}

export interface ReplayIndicatorSpec {
  id: string;
  kind: 'sma' | 'rsi' | 'range';
  period: number;
  /** Spec only — values must be computed on the visible slice. */
}

export interface ReplayScenarioMeta {
  id: string;
  title: string;
  teaser: string;
  eraLabel: string;
  practiceDifficulty: ReplayPracticeDifficulty;
  concealCompetency: boolean;
  /** Internal concept ids. Never show when concealCompetency is true. */
  conceptIds: string[];
  license: ReplayLicenseKind;
  dataKind: DataSourceKind;
  provenanceNote: string;
  timestampFidelity: ReplayTimestampFidelity;
  timestampHonestyNote: string;
  themes: string[];
}

export interface ReplayRevealPayload {
  historicalOutcome: string;
  teachingNotes: string[];
  laterEventOutcomes: Array<{ eventId: string; outcome: string }>;
}

export interface ReplayScenarioPackage {
  schemaVersion: typeof REPLAY_SCENARIO_SCHEMA_VERSION;
  instrument: ReplayInstrument;
  timeframe: CandleInterval;
  decisionTimestamp: number;
  informationCutoff: number;
  bars: ReplayBar[];
  indicatorSpecs: ReplayIndicatorSpec[];
  events: ReplayHistoricalEvent[];
  news: ReplayNewsMeta[];
  meta: ReplayScenarioMeta;
  reveal: ReplayRevealPayload;
}

export interface ReplayVisibleSlice {
  bars: ReplayBar[];
  events: ReplayHistoricalEvent[];
  news: ReplayNewsMeta[];
  cutoffTimestamp: number;
}

/** Point-in-time classification. Later facts stay empty until reveal. */
export interface ReplayClassifiedInformation {
  cutoffTimestamp: number;
  historical: {
    bars: ReplayBar[];
    events: ReplayHistoricalEvent[];
    news: ReplayNewsMeta[];
  };
  later: {
    bars: ReplayBar[];
    events: ReplayHistoricalEvent[];
    news: ReplayNewsMeta[];
    outcomes: string[];
  };
  educationalMetadata: {
    teaser: string;
    eraLabel: string;
    practiceDifficulty: ReplayPracticeDifficulty;
    provenanceNote: string;
    license: ReplayLicenseKind;
    timestampFidelity: ReplayTimestampFidelity;
    timestampHonestyNote: string;
  };
}

export interface ReplayLeakReport {
  ok: boolean;
  reasons: string[];
}
