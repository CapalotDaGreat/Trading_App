import {
  findExactCanonicalInstrument,
  getCanonicalInstrumentById,
} from '../../content/canonical-instruments';
import {
  INSTRUMENT_RESOLUTION_COPY,
  instrumentCountryLabel,
  isUsableMarketPrice,
} from '../../types/instrument.types';
import { resolveMarketIdentity } from '../instrument-identity.service';
import {
  normalizeInstrumentQuery,
} from '../instrument-normalize.service';
import {
  assertCreatableInstrument,
  clearInstrumentResolveCache,
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
    expect(aapl?.name).toBe('Apple Inc.');
    expect(aapl?.exchange).toBe('NASDAQ');
    expect(instrumentCountryLabel(aapl?.country)).toBe('United States');

    const btc = findExactCanonicalInstrument('BTC');
    const bitcoin = findExactCanonicalInstrument('Bitcoin');
    const pair = findExactCanonicalInstrument('BTC/USD');
    expect(btc?.id).toBe('crypto:BTC-USD');
    expect(bitcoin?.id).toBe(btc?.id);
    expect(pair?.id).toBe(btc?.id);

    expect(findExactCanonicalInstrument('EUR/USD')?.id).toBe('forex:EUR-USD');
    expect(findExactCanonicalInstrument('Gold')?.id).toBe('commodity:XAU-USD');
    expect(findExactCanonicalInstrument('XAU/USD')?.id).toBe('commodity:XAU-USD');
    expect(findExactCanonicalInstrument('Gold')?.assetClass).toBe('metal');
  });
});

describe('shared market identity', () => {
  it('maps Gold / XAU/USD to the same commodity quote target, not forex', () => {
    const gold = resolveMarketIdentity('Gold');
    const xau = resolveMarketIdentity('XAU/USD');
    expect(gold.displaySymbol).toBe('XAU/USD');
    expect(gold.quoteSymbol).toBe('GC=F');
    expect(gold.marketType).toBe('commodities');
    expect(gold.assetClass).toBe('metal');
    expect(xau.instrument?.id).toBe(gold.instrument?.id);
  });

  it('reuses Apple identity across alias inputs', () => {
    expect(resolveMarketIdentity('Apple').displaySymbol).toBe('AAPL');
    expect(resolveMarketIdentity('AAPL').name).toBe('Apple Inc.');
  });
});

describe('resolveInstrument', () => {
  beforeEach(() => {
    clearInstrumentResolveCache();
    searchMarkets.mockReset();
    searchMarkets.mockResolvedValue([]);
    fetchQuoteWithMetadata.mockReset();
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

  it('resolves Apple, AAPL, Bitcoin, BTC, EUR/USD, Gold, and XAU/USD', async () => {
    for (const q of ['Apple', 'AAPL', 'Bitcoin', 'BTC', 'EUR/USD', 'Gold', 'XAU/USD']) {
      const result = await resolveInstrument(q);
      expect(result.status).toBe('resolved');
      if (result.status === 'resolved') {
        expect(result.instrument.dataCapabilities.quote).toBe(true);
        expect(result.confidence).toBe('exact');
        expect(isUsableMarketPrice(result.instrument.lastQuotePrice)).toBe(true);
      }
    }
  });

  it('skips remote search on exact catalog matches', async () => {
    const result = await resolveInstrument('AAPL');
    expect(result.status).toBe('resolved');
    expect(searchMarkets).not.toHaveBeenCalled();
  });

  it('returns not_found for unknown and invalid assets', async () => {
    for (const q of ['XYZFAKE123', 'MyCoin', 'RandomStock', 'AAPL<script>']) {
      const result = await resolveInstrument(q);
      expect(result.status).toBe('not_found');
    }
  });

  it('returns unsupported with honest copy when quote fails', async () => {
    fetchQuoteWithMetadata.mockRejectedValueOnce(new Error('timeout'));
    const result = await resolveInstrument('AAPL');
    expect(result.status).toBe('unsupported');
    if (result.status === 'unsupported') {
      expect(result.reason).toContain(INSTRUMENT_RESOLUTION_COPY.couldNotVerify);
      expect(result.reason).toContain(INSTRUMENT_RESOLUTION_COPY.reliableDataOnly);
    }
  });

  it('returns unsupported for known non-tradable demo identity', async () => {
    const result = await resolveInstrument('Unsupported Demo Instrument');
    expect(result.status).toBe('unsupported');
    if (result.status === 'unsupported') {
      expect(result.reason).toContain(INSTRUMENT_RESOLUTION_COPY.couldNotVerify);
    }
  });

  it('returns ambiguous and never silently picks among multiple remote matches', async () => {
    searchMarkets.mockResolvedValueOnce([
      {
        id: 'ACME',
        symbol: 'ACME',
        name: 'Acme Corp',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        isActive: true,
        relevance: 10,
      },
      {
        id: 'ACMEW',
        symbol: 'ACMEW',
        name: 'Acme Warrant',
        marketType: 'stocks',
        assetClass: 'equity',
        currency: 'USD',
        isActive: true,
        relevance: 9,
      },
    ]);

    const result = await resolveInstrument('ACME');
    expect(result.status).toBe('ambiguous');
    if (result.status === 'ambiguous') {
      expect(result.candidates.length).toBeGreaterThan(1);
      expect(result.reason).toBe(INSTRUMENT_RESOLUTION_COPY.whichAsset);
    }
  });

  it('stays resolved from catalog when the search provider is down', async () => {
    searchMarkets.mockRejectedValueOnce(new Error('provider down'));
    const result = await resolveInstrument('Bitcoin');
    expect(result.status).toBe('resolved');
    expect(searchMarkets).not.toHaveBeenCalled();
  });

  it('resolves from catalog in offline / skip-remote search', async () => {
    const hits = await searchInstruments('AAPL', { skipRemote: true });
    expect(hits[0]?.instrument.canonicalSymbol).toBe('AAPL');
    const fake = await searchInstruments('TotallyFakeCoin999', { skipRemote: true });
    expect(fake).toHaveLength(0);
    const result = await resolveInstrument('TotallyFakeCoin999');
    expect(result.status).toBe('not_found');
  });

  it('caches resolved instruments so quote is not probed twice', async () => {
    await resolveInstrument('MSFT');
    await resolveInstrument('MSFT');
    expect(fetchQuoteWithMetadata).toHaveBeenCalledTimes(1);
  });
});

describe('assertCreatableInstrument', () => {
  it('requires a successful quote capability', async () => {
    const instrument = getCanonicalInstrumentById('equity:AAPL')!;
    const ok = await assertCreatableInstrument(instrument);
    expect(ok.dataCapabilities.quote).toBe(true);

    fetchQuoteWithMetadata.mockRejectedValueOnce(new Error('no quote'));
    await expect(assertCreatableInstrument(instrument)).rejects.toThrow(/couldn.t verify/i);
  });

  it('probe attaches last quote price without inventing when fetch works', async () => {
    const instrument = getCanonicalInstrumentById('crypto:BTC-USD')!;
    const probed = await probeInstrumentCapabilities(instrument);
    expect(probed.lastQuotePrice).toBe(100);
    expect(probed.lastQuoteKind).toBe('sample');
  });
});
