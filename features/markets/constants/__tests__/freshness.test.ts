import { oldestTimestamp, withFetchedAt } from '../freshness';

describe('market data freshness', () => {
  it('uses the oldest valid decision-critical timestamp', () => {
    expect(oldestTimestamp([3_000, undefined, 1_000, 2_000])).toBe(1_000);
    expect(oldestTimestamp([undefined, 0, Number.NaN])).toBeUndefined();
  });

  it('preserves provider metadata and the provider observation time', () => {
    const quote = withFetchedAt(
      {
        symbol: 'AAPL',
        price: 100,
        change: 1,
        changePercent: 1,
        open: 99,
        high: 101,
        low: 98,
        previousClose: 99,
        volume: 10,
        timestamp: 1_000,
        status: 'open',
        currency: 'USD',
      },
      'stocks',
      { provider: 'finnhub', kind: 'delayed', fetchedAt: 2_000 },
    );

    expect(quote.provider).toBe('finnhub');
    expect(quote.dataSourceKind).toBe('delayed');
    expect(quote.fetchedAt).toBe(2_000);
    expect(quote.observedAt).toBe(1_000);
  });
});
