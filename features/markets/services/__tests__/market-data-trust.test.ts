jest.mock('@/shared/services/api/api-client', () => ({
  apiRequest: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

import { apiRequest } from '@/shared/services/api/api-client';

import { fetchCandlesWithMetadata } from '../market-data.service';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('market data provenance', () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  it('labels CoinGecko chart points as approximate and records fetch time', async () => {
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
});
