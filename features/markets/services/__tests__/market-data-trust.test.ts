jest.mock('@/shared/services/api/api-client', () => ({
  apiRequest: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

jest.mock('@/shared/services/firebase/callable-proxy', () => ({
  canUseVendorProxy: () => false,
  allowDevDirectVendors: () => true,
  callProxy: jest.fn(),
  ProxyError: class ProxyError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

jest.mock('../market-proxy.service', () => ({
  proxyFetchQuote: jest.fn(async () => null),
  proxyFetchCandles: jest.fn(async () => null),
  proxyMarketSearch: jest.fn(async () => null),
  proxyEconomicCalendar: jest.fn(async () => null),
}));

import { apiRequest, ApiError } from '@/shared/services/api/api-client';

import { fetchCandlesWithMetadata } from '../market-data.service';
import { MarketDataUnavailableError } from '../market-data.service';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('market data provenance', () => {
  const originalFinnhub = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
  const originalAlpha = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY;
  const originalDirect = process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT;

  beforeEach(() => {
    mockedApiRequest.mockReset();
    process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT = 'true';
    process.env.EXPO_PUBLIC_FINNHUB_API_KEY = 'test-finnhub';
    process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY = '';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_FINNHUB_API_KEY = originalFinnhub;
    process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY = originalAlpha;
    process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT = originalDirect;
  });

  it('labels CoinGecko chart points as approximate and records fetch time', async () => {
    process.env.EXPO_PUBLIC_FINNHUB_API_KEY = '';
    mockedApiRequest.mockResolvedValue({
      prices: [
        [1_000, 100],
        [2_000, 102],
      ],
      total_volumes: [
        [1_000, 10],
        [2_000, 12],
      ],
    });
    const before = Date.now();

    const result = await fetchCandlesWithMetadata({
      symbol: 'BTC/USD',
      marketType: 'crypto',
      interval: '1d',
      limit: 2,
    });

    expect(result.provider).toBe('coingecko');
    expect(result.kind).toBe('approximate');
    expect(result.fetchedAt).toBeGreaterThanOrEqual(before);
    expect(result.candles).toHaveLength(2);
  });

  it('falls back to labeled sample equity candles when Finnhub candles return 403', async () => {
    mockedApiRequest.mockRejectedValue(new ApiError('Forbidden', 403));

    const result = await fetchCandlesWithMetadata({
      symbol: 'AAPL',
      marketType: 'stocks',
      interval: '1d',
      limit: 40,
    });

    expect(result.provider).toBe('sample');
    expect(result.kind).toBe('sample');
    expect(result.candles.length).toBe(40);
    expect(result.candles[0]?.timestamp).toBeLessThan(result.candles.at(-1)!.timestamp);
  });

  it('fails closed when genuine FX OHLC is unavailable', async () => {
    mockedApiRequest.mockRejectedValue(new ApiError('Forbidden', 403));

    await expect(
      fetchCandlesWithMetadata({
        symbol: 'EUR/USD',
        marketType: 'forex',
        interval: '1d',
        limit: 40,
      }),
    ).rejects.toBeInstanceOf(MarketDataUnavailableError);
  });
});
