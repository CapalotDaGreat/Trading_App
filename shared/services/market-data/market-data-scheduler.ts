import { AppState, type AppStateStatus } from 'react-native';

import { performanceDiagnostics, type PerformanceDiagnostics } from '@/shared/services/performance';
import type { CandleInterval, MarketType } from '@/shared/types/market';

export interface QuoteScheduleRequest {
  symbol: string;
  marketType?: MarketType;
}

export interface CandleScheduleRequest extends QuoteScheduleRequest {
  interval: CandleInterval;
  limit?: number;
}

interface CacheEntry {
  value: unknown;
  cachedAt: number;
}

interface SchedulerOptions {
  now?: () => number;
  getAppState?: () => AppStateStatus;
  diagnostics?: PerformanceDiagnostics;
  quoteTtlMs?: number;
  candleTtlMs?: number;
}

interface ScheduleOptions {
  ttlMs?: number;
  direct?: boolean;
}

export class MarketDataBackgroundError extends Error {
  constructor() {
    super('Market data refresh paused while the app is inactive');
    this.name = 'MarketDataBackgroundError';
  }
}

function normalizedSymbol(symbol: string): string {
  return symbol.trim().replace(/\s+/g, '').toUpperCase();
}

function currentAppState(): AppStateStatus {
  if (process.env.NODE_ENV === 'test') return 'active';
  return AppState.currentState ?? 'active';
}

export function normalizeQuoteQueryKey(request: QuoteScheduleRequest): string {
  return `quote:${request.marketType ?? 'auto'}:${normalizedSymbol(request.symbol)}`;
}

export function normalizeCandleQueryKey(request: CandleScheduleRequest): string {
  return [
    'candles',
    request.marketType ?? 'auto',
    normalizedSymbol(request.symbol),
    request.interval,
    request.limit ?? 100,
  ].join(':');
}

export class MarketDataScheduler {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly now: () => number;
  private readonly getAppState: () => AppStateStatus;
  private readonly diagnostics: PerformanceDiagnostics;
  private readonly quoteTtlMs: number;
  private readonly candleTtlMs: number;

  constructor(options: SchedulerOptions = {}) {
    this.now = options.now ?? Date.now;
    this.getAppState = options.getAppState ?? currentAppState;
    this.diagnostics = options.diagnostics ?? performanceDiagnostics;
    this.quoteTtlMs = options.quoteTtlMs ?? 10_000;
    this.candleTtlMs = options.candleTtlMs ?? 30_000;
  }

  quote<T>(
    request: QuoteScheduleRequest,
    directRequest: () => Promise<T>,
    options: ScheduleOptions = {},
  ): Promise<T> {
    return this.schedule(
      normalizeQuoteQueryKey(request),
      'quote',
      directRequest,
      options.ttlMs ?? this.quoteTtlMs,
      options.direct,
    );
  }

  candles<T>(
    request: CandleScheduleRequest,
    directRequest: () => Promise<T>,
    options: ScheduleOptions = {},
  ): Promise<T> {
    return this.schedule(
      normalizeCandleQueryKey(request),
      'candles',
      directRequest,
      options.ttlMs ?? this.candleTtlMs,
      options.direct,
    );
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  private schedule<T>(
    key: string,
    requestType: 'quote' | 'candles',
    directRequest: () => Promise<T>,
    ttlMs: number,
    direct = false,
  ): Promise<T> {
    if (direct) {
      this.diagnostics.increment('market.request.direct');
      return directRequest();
    }

    const cached = this.cache.get(key);
    const isFresh = cached && this.now() - cached.cachedAt <= ttlMs;
    if (isFresh) {
      this.diagnostics.increment('market.request.cache_hit');
      return Promise.resolve(cached.value as T);
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      this.diagnostics.increment('market.request.deduped');
      return pending as Promise<T>;
    }

    if (this.getAppState() !== 'active') {
      this.diagnostics.increment('market.request.background_skipped');
      if (cached) return Promise.resolve(cached.value as T);
      return Promise.reject(new MarketDataBackgroundError());
    }

    this.diagnostics.increment('market.request.started');
    const promise = directRequest()
      .then((value) => {
        this.cache.set(key, { value, cachedAt: this.now() });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }
}

export const marketDataScheduler = new MarketDataScheduler();
