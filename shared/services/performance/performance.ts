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

type UnsafeMetadata = PerformanceMetadata & Record<string, unknown>;

const ALLOWED_METADATA_VALUES = {
  requestType: new Set(['quote', 'candles']),
  cacheResult: new Set(['miss', 'hit', 'deduped', 'skipped']),
  appState: new Set(['active', 'inactive']),
  outcome: new Set(['success', 'failure']),
} as const;

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

export class PerformanceDiagnostics {
  private readonly events: PerformanceEvent[] = [];
  private readonly counters: Partial<Record<PerformanceCounter, number>> = {};

  constructor(
    private readonly enabled: boolean,
    private readonly now: () => number = Date.now,
  ) {}

  mark(name: PerformanceMark, metadata?: PerformanceMetadata): void {
    if (!this.enabled) return;
    this.events.push({
      name,
      at: this.now(),
      metadata: sanitizeMetadata(metadata as UnsafeMetadata),
    });
  }

  increment(counter: PerformanceCounter, amount = 1): void {
    if (!this.enabled) return;
    this.counters[counter] = (this.counters[counter] ?? 0) + amount;
  }

  measure<T>(window: PerformanceWindow, operation: () => T, metadata?: PerformanceMetadata): T {
    if (!this.enabled) return operation();
    const startedAt = this.now();
    this.mark(`${window}.begin`, metadata);
    try {
      const result = operation();
      const endedAt = this.now();
      this.events.push({
        name: `${window}.end`,
        at: endedAt,
        durationMs: endedAt - startedAt,
        metadata: sanitizeMetadata({ ...metadata, outcome: 'success' }),
      });
      return result;
    } catch (error) {
      const endedAt = this.now();
      this.events.push({
        name: `${window}.end`,
        at: endedAt,
        durationMs: endedAt - startedAt,
        metadata: sanitizeMetadata({ ...metadata, outcome: 'failure' }),
      });
      throw error;
    }
  }

  async measureAsync<T>(
    window: PerformanceWindow,
    operation: () => Promise<T>,
    metadata?: PerformanceMetadata,
  ): Promise<T> {
    if (!this.enabled) return operation();
    const startedAt = this.now();
    this.mark(`${window}.begin`, metadata);
    try {
      const result = await operation();
      const endedAt = this.now();
      this.events.push({
        name: `${window}.end`,
        at: endedAt,
        durationMs: endedAt - startedAt,
        metadata: sanitizeMetadata({ ...metadata, outcome: 'success' }),
      });
      return result;
    } catch (error) {
      const endedAt = this.now();
      this.events.push({
        name: `${window}.end`,
        at: endedAt,
        durationMs: endedAt - startedAt,
        metadata: sanitizeMetadata({ ...metadata, outcome: 'failure' }),
      });
      throw error;
    }
  }

  snapshot(): PerformanceSnapshot {
    if (!this.enabled) return { events: [], counters: {} };
    return { events: [...this.events], counters: { ...this.counters } };
  }

  reset(): void {
    if (!this.enabled) return;
    this.events.length = 0;
    for (const counter of Object.keys(this.counters) as PerformanceCounter[]) {
      delete this.counters[counter];
    }
  }
}

export const performanceDiagnostics = new PerformanceDiagnostics(__DEV__);
