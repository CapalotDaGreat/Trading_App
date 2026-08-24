import { createHolding, findDuplicateHolding, calculateHoldingPnL, calculatePortfolioSummary } from '../portfolio.service';
import type { CreateHoldingInput, Holding } from '../../types/portfolio.types';
import { DuplicateHoldingError } from '../../types/portfolio.types';

const holdingsStore: Holding[] = [];

jest.mock('@/shared/services/user-data', () => ({
  resolveUserDataBackend: () => 'local',
  getLocalUserRepository: () => ({
    list: async () => holdingsStore.slice(),
    create: async (_col: string, data: Omit<Holding, 'id'>) => {
      const row: Holding = {
        id: `h${holdingsStore.length}`,
        ...data,
      };
      holdingsStore.push(row);
      return row;
    },
    update: async () => undefined,
    delete: async () => undefined,
  }),
}));

jest.mock('@/features/subscription/services/entitlement.service', () => ({
  getLimit: () => 50,
}));

jest.mock('@/shared/constants/subscription', () => ({
  hasReachedLimit: () => false,
}));

jest.mock('@/shared/services/firebase/callable-proxy', () => ({
  canUseVendorProxy: () => false,
}));

const validAapl: CreateHoldingInput = {
  instrumentId: 'equity:AAPL',
  symbol: 'AAPL',
  canonicalSymbol: 'AAPL',
  name: 'Apple Inc.',
  marketType: 'stocks',
  assetClass: 'equity',
  quantity: 1,
  averageCost: 100,
  currentPrice: 190,
  provider: 'finnhub',
  providerSymbol: 'AAPL',
};

describe('createHolding instrument gate', () => {
  beforeEach(() => {
    holdingsStore.length = 0;
  });

  it('rejects creates without resolved instrument identity', async () => {
    await expect(
      createHolding('demo-guest', {
        symbol: 'FAKE',
        name: 'Fake',
        marketType: 'stocks',
        assetClass: 'equity',
        quantity: 1,
        averageCost: 1,
        currentPrice: 1,
      } as CreateHoldingInput),
    ).rejects.toThrow(/resolved market instrument/i);
  });

  it('rejects inventing a zero price', async () => {
    await expect(
      createHolding('demo-guest', {
        ...validAapl,
        currentPrice: 0,
      }),
    ).rejects.toThrow(/never invented|valid market price/i);
  });

  it('does not treat a missing price as a $0 position', () => {
    const holding: Holding = {
      id: 'h1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      marketType: 'stocks',
      assetClass: 'equity',
      quantity: 2,
      averageCost: 100,
      currentPrice: Number.NaN,
      currency: 'USD',
      side: 'long',
      instrumentId: 'equity:AAPL',
      canonicalSymbol: 'AAPL',
      provider: 'finnhub',
      providerSymbol: 'AAPL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const pnl = calculateHoldingPnL(holding);
    expect(pnl.priceAvailable).toBe(false);
    expect(pnl.marketValue).toBe(0);
    const summary = calculatePortfolioSummary([holding]);
    expect(summary.totalValue).toBe(0);
    expect(summary.holdingsCount).toBe(1);
    expect(summary.totalCost).toBe(200);
  });

  it('creates when instrument fields are present and detects duplicates', async () => {
    const first = await createHolding('demo-guest', validAapl);
    expect(first.instrumentId).toBe('equity:AAPL');

    await expect(createHolding('demo-guest', { ...validAapl, quantity: 2 })).rejects.toBeInstanceOf(
      DuplicateHoldingError,
    );

    const dup = findDuplicateHolding([first], {
      instrumentId: 'equity:AAPL',
      canonicalSymbol: 'AAPL',
      symbol: 'AAPL',
    });
    expect(dup?.id).toBe(first.id);
  });
});
