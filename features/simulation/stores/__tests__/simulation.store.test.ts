import { useSimulationStore } from '../simulation.store';

describe('simulation store isolation', () => {
  beforeEach(() => {
    useSimulationStore.setState({ accountsByUser: {}, archivesByUser: {} });
  });

  it('keeps two users on separate ledgers', () => {
    const alice = useSimulationStore.getState().ensureAccount('alice');
    const bob = useSimulationStore.getState().ensureAccount('bob');
    expect(alice.accountId).not.toBe(bob.accountId);

    const bought = useSimulationStore.getState().buy('alice', {
      symbol: 'NESN',
      quantity: 10,
      price: 100,
    });
    expect(bought.ok).toBe(true);

    const aliceAfter = useSimulationStore.getState().accountFor('alice');
    const bobAfter = useSimulationStore.getState().accountFor('bob');
    expect(aliceAfter?.cashBalance).toBe(99_000);
    expect(bobAfter?.cashBalance).toBe(100_000);
    expect(bobAfter?.transactions).toHaveLength(0);
  });

  it('archives the previous ledger on reset', () => {
    useSimulationStore.getState().ensureAccount('alice');
    useSimulationStore.getState().buy('alice', { symbol: 'NESN', quantity: 10, price: 100 });
    const live = useSimulationStore.getState().reset('alice', 'standard');
    expect(live.transactions).toHaveLength(0);
    expect(live.cashBalance).toBe(100_000);
    const archives = useSimulationStore.getState().archivesFor('alice');
    expect(archives).toHaveLength(1);
    expect(archives[0]?.status).toBe('archived');
    expect(archives[0]?.transactions).toHaveLength(1);
  });

  it('opens a new production path on reset and honors practice difficulty', () => {
    const first = useSimulationStore.getState().ensureAccount('alice', 'standard', undefined, 'USD', {
      difficulty: 'beginner',
    });
    expect(first.scenario?.difficulty).toBe('beginner');
    const second = useSimulationStore.getState().reset('alice', 'standard', undefined, 'USD', {
      difficulty: 'expert',
    });
    expect(second.cashBalance).toBe(100_000);
    expect(second.scenario?.difficulty).toBe('expert');
    expect(second.scenario?.seed).not.toBe(first.scenario?.seed);
    expect(second.checkpoints).toEqual([]);
  });
});
