import { migrateSimulationAccount, migrateSimulationPersist } from '../simulation-persist.service';

describe('simulation persist migrate', () => {
  it('maps v1 field names onto the current account model', () => {
    const migrated = migrateSimulationAccount({
      accountId: 'sim_old',
      userId: 'alice',
      currency: 'chf',
      mode: 'standard',
      startingBalance: 100_000,
      cashBalance: 91_000,
      equity: 100_000,
      simulationStatus: 'active',
      drawdown: 0.02,
      positions: [
        {
          symbol: 'nesn',
          quantity: 100,
          averageEntry: 90,
          currentPrice: 90,
          marketValue: 9_000,
          unrealizedPnL: 0,
          realizedPnL: 0,
          exposurePercent: 0.09,
        },
      ],
      transactions: [
        {
          id: 'txn_1',
          timestamp: '2026-09-08T00:00:00.000Z',
          symbol: 'NESN',
          side: 'buy',
          quantity: 100,
          price: 90,
          fees: 0,
          totalValue: 9_000,
        },
      ],
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });

    expect(migrated.id).toBe('sim_old');
    expect(migrated.accountId).toBe('sim_old');
    expect(migrated.currency).toBe('CHF');
    expect(migrated.status).toBe('active');
    expect(migrated.currentDrawdown).toBeCloseTo(-0.02);
    expect(migrated.drawdown).toBeCloseTo(0.02);
    expect(migrated.positions[0]?.averageEntryPrice).toBe(90);
    expect(migrated.positions[0]?.portfolioWeight).toBeCloseTo(0.09);
    expect(migrated.transactions[0]?.executionPrice).toBe(90);
    expect(migrated.transactions[0]?.grossValue).toBe(9_000);
    expect(migrated.orders).toEqual([]);
  });

  it('keeps archives when bumping persist version', () => {
    const next = migrateSimulationPersist({
      accountsByUser: {
        alice: { accountId: 'live', userId: 'alice', simulationStatus: 'active', cashBalance: 1 },
      },
      archivesByUser: {
        alice: [{ accountId: 'old', userId: 'alice', simulationStatus: 'reset', cashBalance: 2 }],
      },
    });
    expect(next.accountsByUser.alice?.id).toBe('live');
    expect(next.archivesByUser.alice?.[0]?.id).toBe('old');
    expect(next.archivesByUser.alice?.[0]?.status).toBe('archived');
  });

  it('fills a missing currency with USD, but keeps an explicit CHF book', () => {
    const missing = migrateSimulationAccount({
      accountId: 'sim_new',
      userId: 'bob',
      cashBalance: 1,
    });
    expect(missing.currency).toBe('USD');
  });
});
