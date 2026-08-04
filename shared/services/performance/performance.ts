export type PerformanceMark =
  | 'startup.begin'
  | 'startup.ready'
  | 'brief.build.begin'
  | 'brief.build.end'
  | 'chart.work.begin'
  | 'chart.work.end'
  | 'chart.render.begin'
  | 'chart.render.end';

export type PerformanceCounter =
  | 'market.request.started'
  | 'market.request.deduped'
  | 'market.request.cache_hit'
  | 'market.request.background_skipped'
  | 'market.request.direct';

export type PerformanceWindow = 'brief.build' | 'chart.work' | 'chart.render';

export interface PerformanceMetadata {
  requestType?: 'quote' | 'candles';
  cacheResult?: 'miss' | 'hit' | 'deduped' | 'skipped';
  appState?: 'active' | 'inactive';
  outcome?: 'success' | 'failure';
}

export interface PerformanceEvent {
  name: PerformanceMark;
  at: number;
  durationMs?: number;
  metadata?: PerformanceMetadata;
}

export interface PerformanceSnapshot {
  events: readonly PerformanceEvent[];
  counters: Readonly<Partial<Record<PerformanceCounter, number>>>;
}

export type PerformanceAnalyticsSink = (
  name:
    | 'perf_cold_start'
    | 'perf_warm_start'
    | 'perf_screen_load'
    | 'perf_api_latency'
    | 'perf_cache_hit',
  props?: { durationMs?: number; latencyMs?: number; screen?: string; feature?: string; count?: number; cacheResult?: string },
) => void;

type UnsafeMetadata = PerformanceMetadata & Record<string, unknown>;

const ALLOWED_METADATA_VALUES = {
  requestType: new Set(['quote', 'candles']),
  cacheResult: new Set(['miss', 'hit', 'deduped', 'skipped']),
  appState: new Set(['active', 'inactive']),
  outcome: new Set(['success', 'failure']),
} as const;

let analyticsSink: PerformanceAnalyticsSink | null = null;
let analyticsSampleRate = 0.2;

/** Wire from AppProviders to avoid Firebase imports in unit tests. */
export function configurePerformanceAnalytics(
  sink: PerformanceAnalyticsSink | null,
  sampleRate = 0.2,
): void {
  analyticsSink = sink;
  analyticsSampleRate = sampleRate;
}

function sanitizeMetadata(metadata?: UnsafeMetadata): PerformanceMetadata | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (
      key in ALLOWED_METADATA_VALUES &&
      typeof value === 'string' &&
      (ALLOWED_METADATA_VALUES[key as keyof typeof ALLOWED_METADATA_VALUES] as Set<string>).has(
        value,
      )
    ) {
      sanitized[key] = value;
    }
  }
  return Object.keys(sanitized).length ? (sanitized as PerformanceMetadata) : undefined;
}

function emitSample(
  name: Parameters<PerformanceAnalyticsSink>[0],
  props?: Parameters<PerformanceAnalyticsSink>[1],
): void {
  if (!analyticsSink) return;
  if (Math.random() > analyticsSampleRate) return;
  analyticsSink(name, props);
}

export class PerformanceDiagnostics {
  private readonly events: PerformanceEvent[] = [];
  private readonly counters: Partial<Record<PerformanceCounter, number>> = {};
  private startupBeginAt: number | null = null;

  constructor(
    private readonly alwaysRecord: boolean,
    private readonly now: () => number = Date.now,
  ) {}

  mark(name: PerformanceMark, metadata?: PerformanceMetadata): void {
    if (name === 'startup.begin') this.startupBeginAt = this.now();
    if (name === 'startup.ready' && this.startupBeginAt != null) {
      const durationMs = this.now() - this.startupBeginAt;
      emitSample(durationMs > 3_000 ? 'perf_cold_start' : 'perf_warm_start', { durationMs });
    }

    if (!this.alwaysRecord) return;
    this.events.push({
      name,
      at: this.now(),
      metadata: sanitizeMetadata(metadata as UnsafeMetadata),
    });
  }

  increment(counter: PerformanceCounter, amount = 1): void {
    if (counter === 'market.request.cache_hit') {
      emitSample('perf_cache_hit', { count: amount, cacheResult: 'hit' });
    }
    if (!this.alwaysRecord) return;
    this.counters[counter] = (this.counters[counter] ?? 0) + amount;
  }

  measure<T>(window: PerformanceWindow, operation: () => T, metadata?: PerformanceMetadata): T {
    const startedAt = this.now();
    if (this.alwaysRecord) this.mark(`${window}.begin`, metadata);
    try {
      const result = operation();
      const durationMs = this.now() - startedAt;
      if (this.alwaysRecord) {
        this.events.push({
          name: `${window}.end`,
          at: this.now(),
          durationMs,
          metadata: sanitizeMetadata({ ...metadata, outcome: 'success' }),
        });
      }
      if (window === 'brief.build') {
        emitSample('perf_screen_load', { screen: 'brief', durationMs });
      }
      return result;
    } catch (error) {
      if (this.alwaysRecord) {
        this.events.push({
          name: `${window}.end`,
          at: this.now(),
          durationMs: this.now() - startedAt,
          metadata: sanitizeMetadata({ ...metadata, outcome: 'failure' }),
        });
      }
      throw error;
    }
  }

  async measureAsync<T>(
    window: PerformanceWindow,
    operation: () => Promise<T>,
    metadata?: PerformanceMetadata,
  ): Promise<T> {
    const startedAt = this.now();
    if (this.alwaysRecord) this.mark(`${window}.begin`, metadata);
    try {
      const result = await operation();
      const durationMs = this.now() - startedAt;
      if (this.alwaysRecord) {
        this.events.push({
          name: `${window}.end`,
          at: this.now(),
          durationMs,
          metadata: sanitizeMetadata({ ...metadata, outcome: 'success' }),
        });
      }
      if (window === 'brief.build' || metadata?.requestType) {
        emitSample('perf_api_latency', { latencyMs: durationMs, feature: window });
      }
      return result;
    } catch (error) {
      if (this.alwaysRecord) {
        this.events.push({
          name: `${window}.end`,
          at: this.now(),
          durationMs: this.now() - startedAt,
          metadata: sanitizeMetadata({ ...metadata, outcome: 'failure' }),
        });
      }
      throw error;
    }
  }

  snapshot(): PerformanceSnapshot {
    if (!this.alwaysRecord) return { events: [], counters: {} };
    return { events: [...this.events], counters: { ...this.counters } };
  }

  reset(): void {
    if (!this.alwaysRecord) return;
    this.events.length = 0;
    for (const counter of Object.keys(this.counters) as PerformanceCounter[]) {
      delete this.counters[counter];
    }
  }
}

/** Always record in __DEV__; production emits via configurePerformanceAnalytics sink. */
export const performanceDiagnostics = new PerformanceDiagnostics(__DEV__);
