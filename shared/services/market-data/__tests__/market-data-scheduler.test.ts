import { PerformanceDiagnostics } from '../../performance';
import { MarketDataScheduler } from '../market-data-scheduler';

describe('MarketDataScheduler', () => {
  let now: number;
  let appState: 'active' | 'background';
  let diagnostics: PerformanceDiagnostics;
  let scheduler: MarketDataScheduler;

  beforeEach(() => {
    now = 1_000;
    appState = 'active';
    diagnostics = new PerformanceDiagnostics(true, () => now);
    scheduler = new MarketDataScheduler({
      now: () => now,
      getAppState: () => appState,
      diagnostics,
      quoteTtlMs: 100,
      candleTtlMs: 100,
    });
  });

  it('normalizes keys and deduplicates in-flight quote requests', async () => {
    let resolveRequest!: (value: { value: number }) => void;
    const loader = jest.fn(
      () =>
        new Promise<{ value: number }>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const first = scheduler.quote({ symbol: ' btc/usd ', marketType: 'crypto' }, loader);
    const second = scheduler.quote({ symbol: 'BTC/USD', marketType: 'crypto' }, loader);
    resolveRequest({ value: 1 });

    await expect(Promise.all([first, second])).resolves.toEqual([{ value: 1 }, { value: 1 }]);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(diagnostics.snapshot().counters['market.request.deduped']).toBe(1);
  });

  it('returns cached data within TTL and refreshes after expiry', async () => {
    const loader = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const request = { symbol: 'SPY', marketType: 'stocks' as const };

    await expect(scheduler.quote(request, loader)).resolves.toBe('first');
    now += 100;
    await expect(scheduler.quote(request, loader)).resolves.toBe('first');
    now += 1;
    await expect(scheduler.quote(request, loader)).resolves.toBe('second');

    expect(loader).toHaveBeenCalledTimes(2);
    expect(diagnostics.snapshot().counters['market.request.cache_hit']).toBe(1);
  });

  it('does not initiate work in the background and can return stale cache', async () => {
    const loader = jest.fn().mockResolvedValue('cached');
    const request = { symbol: 'SPY', marketType: 'stocks' as const };
    await scheduler.quote(request, loader);
    now += 101;
    appState = 'background';

    await expect(scheduler.quote(request, loader)).resolves.toBe('cached');
    await expect(scheduler.quote({ symbol: 'QQQ', marketType: 'stocks' }, loader)).rejects.toThrow(
      'paused',
    );

    expect(loader).toHaveBeenCalledTimes(1);
    expect(diagnostics.snapshot().counters['market.request.background_skipped']).toBe(2);
  });

  it('supports a direct rollback path', async () => {
    appState = 'background';
    const loader = jest.fn().mockResolvedValue('direct');

    await expect(
      scheduler.candles({ symbol: 'SPY', marketType: 'stocks', interval: '1d' }, loader, {
        direct: true,
      }),
    ).resolves.toBe('direct');

    expect(loader).toHaveBeenCalledTimes(1);
    expect(diagnostics.snapshot().counters['market.request.direct']).toBe(1);
  });

  it('never records query keys or symbols in diagnostics', async () => {
    await scheduler.quote({ symbol: 'PRIVATE-ASSET', marketType: 'stocks' }, async () => 'ok');

    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('PRIVATE-ASSET');
  });
});
