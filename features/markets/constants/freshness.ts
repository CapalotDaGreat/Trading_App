import type { CandleInterval, MarketType, Quote } from '@/shared/types/market';

import type { DataSourceKind, MarketDataProvider, MarketDataProvenance } from './data-source';

/** Polling / freshness policy for live market data across the app. */
export const MARKET_DATA_POLICY = {
  quoteStaleMs: 10_000,
  quoteRefetchMs: 30_000,
  quoteBatchRefetchMs: 45_000,
  candleStaleMs: 30_000,
  candleRefetchMs: 60_000,
  dashboardStaleMs: 45_000,
  dashboardRefetchMs: 60_000,
  briefStaleMs: 45_000,
  briefRefetchMs: 90_000,
  fearGreedStaleMs: 15 * 60_000,
  fearGreedRefetchMs: 30 * 60_000,
  maxQuoteAgeMs: 90_000,
} as const;

export type DataFreshnessLevel = 'live' | 'recent' | 'stale' | 'unknown';

export function getDataFreshness(
  fetchedAt: number | undefined,
  maxLiveMs = MARKET_DATA_POLICY.maxQuoteAgeMs,
): DataFreshnessLevel {
  if (!fetchedAt) return 'unknown';
  const age = Date.now() - fetchedAt;
  if (age <= 30_000) return 'live';
  if (age <= maxLiveMs) return 'recent';
  return 'stale';
}

export function freshnessLabel(level: DataFreshnessLevel): string {
  switch (level) {
    case 'live':
      return 'Live';
    case 'recent':
      return 'Updated';
    case 'stale':
      return 'May be delayed';
    default:
      return 'Unknown';
  }
}

export interface LiveQuote extends Quote {
  fetchedAt: number;
  observedAt: number;
  marketType: MarketType;
  provider: MarketDataProvider;
  dataSourceKind: DataSourceKind;
}

export function oldestTimestamp(timestamps: (number | null | undefined)[]): number | undefined {
  const valid = timestamps.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0,
  );
  return valid.length ? Math.min(...valid) : undefined;
}

export function quoteObservedAt(quote: Quote, fetchedAt: number): number {
  return oldestTimestamp([quote.timestamp, fetchedAt]) ?? fetchedAt;
}

export function withFetchedAt(
  quote: Quote,
  marketType: MarketType,
  provenance?: MarketDataProvenance,
): LiveQuote {
  const fetchedAt = provenance?.fetchedAt ?? quote.timestamp;
  return {
    ...quote,
    fetchedAt,
    observedAt: quoteObservedAt(quote, fetchedAt),
    marketType,
    provider: provenance?.provider ?? 'sample',
    dataSourceKind: provenance?.kind ?? 'sample',
  };
}

export const DEFAULT_BRIEF_SYMBOLS = [
  'SPY',
  'QQQ',
  'AAPL',
  'NVDA',
  'MSFT',
  'BTC/USD',
  'ETH/USD',
  'EUR/USD',
  'XAUUSD',
] as const;

export const CORE_BENCHMARKS = ['SPY', 'QQQ', 'DIA', 'IWM', 'BTC/USD'] as const;

export type ChartReplayInterval = Extract<CandleInterval, '15m' | '1h' | '4h' | '1d'>;
