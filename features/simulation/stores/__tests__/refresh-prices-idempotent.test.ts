import {
  setSimulationPriceProvider,
  useSimulationStore,
} from '../simulation.store';
import type { SimulationAccount, SimulationPriceProvider } from '../../types/simulation.types';

describe('simulation refreshPrices', () => {
  beforeEach(() => {
    useSimulationStore.setState({ accountsByUser: {}, archivesByUser: {} });
  });

  it('skips writeLive when marks are unchanged', () => {
    const now = '2026-09-16T12:00:00.000Z';
    const account: SimulationAccount = {
      id: 'sim-1',
      accountId: 'sim-1',
      userId: 'user-refresh',
      currency: 'USD',
      mode: 'standard',
      startingBalance: 100_000,
      cashBalance: 99_900,
      investedAmount: 100,
      equity: 100_000,
      buyingPower: 99_900,
      positions: [
        {
          symbol: 'SPY',
          assetType: 'equity',
          quantity: 1,
          averageEntryPrice: 100,
          currentPrice: 100,
          marketValue: 100,
          unrealizedPnL: 0,
          realizedPnL: 0,
          portfolioWeight: 0.001,
        },
      ],
      transactions: [],
      orders: [],
      decisions: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalReturn: 0,
      peakEquity: 100_000,
      currentDrawdown: 0,
      maxDrawdown: 0,
      drawdown: 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
    useSimulationStore.setState({
      accountsByUser: { 'user-refresh': account },
    });

    const provider: SimulationPriceProvider = {
      getQuote: () => ({
        symbol: 'SPY',
        price: 100,
        asOf: now,
        kind: 'sample',
        provider: 'synthetic',
        label: 'SIMULATED',
        currency: 'USD',
      }),
      getQuotes: () => [],
    };
    setSimulationPriceProvider(provider);

    let writes = 0;
    const unsub = useSimulationStore.subscribe(() => {
      writes += 1;
    });
    const next = useSimulationStore.getState().refreshPrices('user-refresh', Date.parse(now));
    unsub();

    expect(writes).toBe(0);
    expect(next).toBe(useSimulationStore.getState().accountsByUser['user-refresh']);
  });
});
