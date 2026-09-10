import {
  estimatedScenarioTapeBytes,
  hydrateScenarioTape,
  migrateSimulationAccount,
  migrateSimulationPersist,
  slimScenarioForPersist,
  slimSimulationAccountForPersist,
  SIMULATION_CHECKPOINT_PERSIST_CAP,
  SIMULATION_TRANSACTION_PERSIST_CAP,
} from '../simulation-persist.service';
import { generateSimulationScenario } from '../scenario-generator.service';

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
    expect(migrated.checkpoints).toEqual([]);
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

describe('simulation persist tape slimming', () => {
  it('drops regenerated paths and restores them from the internal seed', () => {
    const generated = generateSimulationScenario({
      userId: 'persist-size',
      seed: 42,
      now: '2026-09-10T00:00:00.000Z',
    });
    const advanced = { ...generated, clockDay: 7 };
    const fullBytes = JSON.stringify(advanced).length;
    const slim = slimScenarioForPersist(advanced);
    const slimBytes = JSON.stringify(slim).length;

    expect(estimatedScenarioTapeBytes(slim)).toBeLessThan(80);
    expect(slimBytes).toBeLessThan(fullBytes * 0.4);
    expect(slim.clockDay).toBe(7);
    expect(slim.seed).toBe(42);

    const hydrated = hydrateScenarioTape(slim);
    expect(hydrated.clockDay).toBe(7);
    expect(hydrated.seed).toBe(42);
    expect(hydrated.marketPath.length).toBe(generated.marketPath.length);
    expect(Object.keys(hydrated.paths).length).toBe(Object.keys(generated.paths).length);
    expect(hydrated.marketPath[0]?.close).toBe(generated.marketPath[0]?.close);
  });

  it('caps persisted transactions and checkpoints', () => {
    const generated = generateSimulationScenario({
      userId: 'cap',
      seed: 7,
      now: '2026-09-10T00:00:00.000Z',
    });
    const account = migrateSimulationAccount({
      accountId: 'sim_cap',
      userId: 'cap',
      cashBalance: 100_000,
      scenario: generated,
      transactions: Array.from({ length: 120 }, (_, index) => ({
        id: `txn_${index}`,
        timestamp: '2026-09-10T00:00:00.000Z',
        symbol: 'ACME',
        side: 'buy',
        quantity: 1,
        price: 10,
        fees: 0,
        totalValue: 10,
      })),
      checkpoints: Array.from({ length: 60 }, (_, index) => ({
        id: `cp_${index}`,
        at: '2026-09-10T00:00:00.000Z',
        kind: 'window',
      })),
    });
    const slim = slimSimulationAccountForPersist(account);
    expect(slim.transactions).toHaveLength(SIMULATION_TRANSACTION_PERSIST_CAP);
    expect(slim.checkpoints).toHaveLength(SIMULATION_CHECKPOINT_PERSIST_CAP);
    expect(slim.scenario?.marketPath).toEqual([]);
  });
});
