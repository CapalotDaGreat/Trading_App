import { useCompetencyEvidenceStore } from '@/features/competency/stores/competency-evidence.store';

import { GENERIC_SIMULATION_TRAINING_RATIONALE } from '../../services/scenario-personalization.service';
import { useSimulationStore } from '../simulation.store';

describe('simulation store isolation', () => {
  beforeEach(() => {
    useSimulationStore.setState({ accountsByUser: {}, archivesByUser: {} });
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('keeps two users on separate ledgers', () => {
    const alice = useSimulationStore.getState().ensureAccount('alice');
    const bob = useSimulationStore.getState().ensureAccount('bob');
    expect(alice.accountId).not.toBe(bob.accountId);

    const bought = useSimulationStore.getState().buy('alice', {
      symbol: 'NESN',
      quantity: 10,
      price: 100,
      thesis: 'Defined educational thesis for the test',
      invalidation: 'Invalid if the written level breaks',
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
    useSimulationStore.getState().buy('alice', {
      symbol: 'NESN',
      quantity: 10,
      price: 100,
      thesis: 'Defined educational thesis for the test',
      invalidation: 'Invalid if the written level breaks',
    });
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

  it('personalizes guest and signed-in books independently', () => {
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'demo-guest',
      conceptId: 'fomo',
      sourceType: 'simulation_decision',
      sourceId: 'g1',
      occurredAt: Date.parse('2026-09-10T00:00:00.000Z'),
      independent: true,
      processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
    });
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'demo-guest',
      conceptId: 'fomo',
      sourceType: 'simulation_decision',
      sourceId: 'g2',
      occurredAt: Date.parse('2026-09-10T00:00:01.000Z'),
      independent: true,
      processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
    });
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'alice',
      conceptId: 'event-risk',
      sourceType: 'event_exercise',
      sourceId: 'a1',
      occurredAt: Date.parse('2026-09-10T00:00:00.000Z'),
      independent: true,
      scenarioContext: 'earnings',
      processMetrics: { processQuality: 30 },
    });
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'alice',
      conceptId: 'event-risk',
      sourceType: 'event_exercise',
      sourceId: 'a2',
      occurredAt: Date.parse('2026-09-10T00:00:01.000Z'),
      independent: true,
      scenarioContext: 'earnings',
      processMetrics: { processQuality: 27 },
    });

    const guest = useSimulationStore.getState().ensureAccount('demo-guest');
    const alice = useSimulationStore.getState().ensureAccount('alice');
    expect(guest.accountId).not.toBe(alice.accountId);
    expect(guest.cashBalance).toBe(100_000);
    expect(alice.cashBalance).toBe(100_000);
    expect(guest.scenario?.focus).toBe('fomo_chase');
    expect(alice.scenario?.focus).toBe('event_adaptation');
    expect(alice.scenario?.events[0]?.kind).toBe('earnings');
    expect(guest.scenario?.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
    expect(alice.scenario?.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
    expect(useSimulationStore.getState().accountFor('demo-guest')?.scenario?.focus).toBe('fomo_chase');
    expect(useSimulationStore.getState().accountFor('alice')?.scenario?.focus).toBe('event_adaptation');
  });
});
