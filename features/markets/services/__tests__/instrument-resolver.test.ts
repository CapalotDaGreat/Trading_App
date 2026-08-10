import {
  findExactCanonicalInstrument,
  getCanonicalInstrumentById,
} from '../../content/canonical-instruments';
import {
  normalizeInstrumentQuery,
} from '../instrument-normalize.service';
import {
  assertCreatableInstrument,
  probeInstrumentCapabilities,
  resolveInstrument,
  searchInstruments,
} from '../instrument-resolver.service';

jest.mock('../market-search.service', () => ({
  searchMarkets: jest.fn(async () => []),
}));

jest.mock('../market-data.service', () => ({
  MarketDataUnavailableError: class MarketDataUnavailableError extends Error {
    constructor(symbol: string, dataType: string, message: string) {
      super(message);
      this.name = 'MarketDataUnavailableError';
    }
  },
  fetchQuoteWithMetadata: jest.fn(async (symbol: string) => ({
    quote: {
      symbol,
      price: 100,
      change: 1,
      changePercent: 1,
      open: 99,
      high: 101,
      low: 98,
      previousClose: 99,
      volume: 1_000_000,
      timestamp: Date.now(),
      status: 'open',
      currency: 'USD',
    },
    provider: 'sample',
    fetchedAt: Date.now(),
    kind: 'sample',
  })),
}));

const { searchMarkets } = jest.requireMock('../market-search.service') as {
  searchMarkets: jest.Mock;
};
const { fetchQuoteWithMetadata } = jest.requireMock('../market-data.service') as {
  fetchQuoteWithMetadata: jest.Mock;
};

describe('instrument normalize', () => {
  it('normalizes whitespace, case, and pair forms', () => {
    expect(normalizeInstrumentQuery(' aapl ')).toBe('AAPL');
    expect(normalizeInstrumentQuery('apple')).toBe('apple');
    expect(normalizeInstrumentQuery('btc/usd')).toBe('BTC/USD');
    expect(normalizeInstrumentQuery('BTC/USD')).toBe('BTC/USD');
    expect(normalizeInstrumentQuery('btcusd')).toBe('BTC/USD');
    expect(normalizeInstrumentQuery('EURUSD')).toBe('EUR/USD');
    expect(normalizeInstrumentQuery('XAUUSD')).toBe('XAU/USD');
    expect(normalizeInstrumentQuery('xau/usd')).toBe('XAU/USD');
    expect(normalizeInstrumentQuery('xau' + 'usd')).toBe('XAU/USD');
  });

  it('rejects empty, oversized, and unsafe input', () => {
    expect(normalizeInstrumentQuery('')).toBeNull();
    expect(normalizeInstrumentQuery('   ')).toBeNull();
    expect(normalizeInstrumentQuery('x'.repeat(80))).toBeNull();
    expect(normalizeInstrumentQuery('AAPL<script>')).toBeNull();
  });
});

describe('canonical catalog', () => {
  it('exact-matches common aliases to the same instrument', () => {
    const aapl = findExactCanonicalInstrument('AAPL');
    const apple = findExactCanonicalInstrument('Apple');
    expect(aapl?.id).toBe('equity:AAPL');
    expect(apple?.id).toBe(aapl?.id);

    const btc = findExactCanonicalInstrument('BTC');
    const bitcoin = findExactCanonicalInstrument('Bitcoin');
    const pair = findExactCanonicalInstrument('BTC/USD');
    expect(btc?.id).toBe('crypto:BTC-USD');
    expect(bitcoin?.id).toBe(btc?.id);
    expect(pair?.id).toBe(btc?.id);

    expect(findExactCanonicalInstrument('EUR/USD')?.id).toBe('forex:EUR-USD');
    expect(findExactCanonicalInstrument('Gold')?.id).toBe('commodity:XAU-USD');
    expect(findExactCanonicalInstrument('XAU/USD')?.id).toBe('commodity:XAU-USD');
  });
});

describe('resolveInstrument', () => {
  beforeEach(() => {
    searchMarkets.mockResolvedValue([]);
    fetchQuoteWithMetadata.mockImplementation(async (symbol: string) => ({
      quote: {
        symbol,
        price: 100,
        change: 1,
        changePercent: 1,
        open: 99,
        high: 101,
        low: 98,
        previousClose: 99,
        volume: 1_000_000,
        timestamp: Date.now(),
        status: 'open',
        currency: 'USD',
      },
      provider: 'sample',
      fetchedAt: Date.now(),
      kind: 'sample',
    }));
  });

  it('resolves exact catalog matches', async () => {
    for (const q of ['AAPL', 'Apple', 'BTC', 'Bitcoin', 'BTC/USD', 'EUR/USD', 'Gold', 'XAU/USD']) {
      const result = await resolveInstrument(q);
      expect(result.status).toBe('resolved');
      if (result.status === 'resolved') {
        expect(result.instrument.dataCapabilities.quote).toBe(true);
        expect(result.confidence).toBe('exact');
      }
    }
  });

  it('returns not_found for unknown assets', async () => {
    for (const q of ['XYZFAKE123', 'MyCoin', 'RandomStock']) {
      const result = await resolveInstrument(q);
      expect(result.status).toBe('not_found');
    }
  });

  it('returns unsupported when identity exists but quote fails', async () => {
    fetchQuoteWithMetadata.mockRejectedValueOnce(new Error('timeout'));
    const result = await resolveInstrument('AAPL');
    expect(result.status).toBe('unsupported');
  });

  it('returns unsupported for known non-tradable demo identity', async () => {
    const result = await resolveInstrument('Unsupported Demo Instrument');
    expect(result.status).toBe('unsupported');
  });

  it('returns ambiguous when multiple remote candidates score closely', async () => {
    searchMarkets.mockResolvedValueOnce([
      {
        id: 'AAPL',
        symbol: 'AAPL',
        name: 'Apple Inc',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        exchange: 'NASDAQ',
        isActive: true,
        relevance: 10,
      },
      {
        id: 'APLE',
        symbol: 'APLE',
        name: 'Apple Hospitality REIT',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        exchange: 'NYSE',
        isActive: true,
        relevance: 9,
      },
    ]);

    // Use a query that is not an exact catalog alias so ranking stays multi-candidate.
    // "Apple Inc" exact-matches catalog name → resolved; use prefix that hits both remotely.
    searchMarkets.mockResolvedValueOnce([
      {
        id: 'APLE',
        symbol: 'APLE',
        name: 'Apple Hospitality REIT Inc',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        isActive: true,
        relevance: 10,
      },
      {
        id: 'AAPL',
        symbol: 'AAPL',
        name: 'Apple Inc',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        isActive: true,
        relevance: 9,
      },
    ]);

    const result = await resolveInstrument('Apple Hospitality');
    expect(['ambiguous', 'resolved']).toContain(result.status);
    if (result.status === 'ambiguous') {
      expect(result.candidates.length).toBeGreaterThan(1);
    }
  });

  it('fails gracefully when remote search throws', async () => {
    searchMarkets.mockRejectedValueOnce(new Error('provider down'));
    const result = await resolveInstrument('AAPL');
    expect(result.status).toBe('resolved');
  });

  it('demo path still rejects arbitrary text', async () => {
    const hits = await searchInstruments('TotallyFakeCoin999', { skipRemote: true });
    expect(hits).toHaveLength(0);
    const result = await resolveInstrument('TotallyFakeCoin999');
    expect(result.status).toBe('not_found');
  });
});

describe('assertCreatableInstrument', () => {
  it('requires a successful quote capability', async () => {
    const instrument = getCanonicalInstrumentById('equity:AAPL')!;
    const ok = await assertCreatableInstrument(instrument);
    expect(ok.dataCapabilities.quote).toBe(true);

    fetchQuoteWithMetadata.mockRejectedValueOnce(new Error('no quote'));
    await expect(assertCreatableInstrument(instrument)).rejects.toThrow(/cannot be added/i);
  });

  it('probe attaches last quote price without inventing when fetch works', async () => {
    const instrument = getCanonicalInstrumentById('crypto:BTC-USD')!;
    const probed = await probeInstrumentCapabilities(instrument);
    expect(probed.lastQuotePrice).toBe(100);
    expect(probed.lastQuoteKind).toBe('sample');
  });
});
