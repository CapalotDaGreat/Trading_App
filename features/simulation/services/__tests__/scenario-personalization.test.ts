import { createEvidenceRecord, scoreAllCompetencyMastery } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';

import { generateSimulationScenario } from '../scenario-generator.service';
import {
  GENERIC_SIMULATION_TRAINING_RATIONALE,
  personalizeSimulationTraining,
} from '../scenario-personalization.service';
import { publicScenarioView, publicViewLeaks } from '../scenario-visibility.service';
import { createSimulationAccount } from '../simulation-engine.service';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');

function ev(
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'uid' | 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    result: 'fail',
    ...partial,
  });
}

describe('simulation scenario personalization', () => {
  it('maps repeated FOMO flags to a chase-context book without naming the skill', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const plan = personalizeSimulationTraining({
      records,
      mastery: scoreAllCompetencyMastery(records, NOW),
    });
    expect(plan.focus).toBe('fomo_chase');
    expect(plan.personalized).toBe(true);
    expect(plan.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
    expect(plan.trainingRationale?.toLowerCase()).not.toMatch(/fomo|buy this|sell this|correct trade/);
  });

  it('maps weak invalidation to an invalidation-discipline context', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'i1',
        processMetrics: { processQuality: 32, flags: { missingInvalidation: true } },
      }),
      ev({
        uid: 'learner',
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'i2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 30, flags: { missingInvalidation: true } },
      }),
    ];
    const plan = personalizeSimulationTraining({ records, mastery: scoreAllCompetencyMastery(records, NOW) });
    expect(plan.focus).toBe('invalidation_discipline');
  });

  it('maps poor sizing to a volatility / risk-aware sizing context', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        processMetrics: { processQuality: 25, flags: { exceededRiskLimit: true } },
      }),
      ev({
        uid: 'learner',
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 's2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 22, flags: { exceededRiskLimit: true } },
      }),
    ];
    expect(personalizeSimulationTraining({ records, mastery: scoreAllCompetencyMastery(records, NOW) }).focus).toBe(
      'position_sizing',
    );
  });

  it('maps overconfidence to a conflicting-information context', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'overconfidence',
        sourceType: 'practice_drill',
        sourceId: 'o1',
        processMetrics: { processQuality: 34 },
      }),
      ev({
        uid: 'learner',
        conceptId: 'overconfidence',
        sourceType: 'simulation_decision',
        sourceId: 'o2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 31 },
      }),
    ];
    expect(personalizeSimulationTraining({ records, mastery: scoreAllCompetencyMastery(records, NOW) }).focus).toBe(
      'overconfidence',
    );
  });

  it('selects an educational event kind when event-risk is weak', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'event-risk',
        sourceType: 'event_exercise',
        sourceId: 'e1',
        scenarioContext: 'earnings',
        processMetrics: { processQuality: 30 },
      }),
      ev({
        uid: 'learner',
        conceptId: 'event-risk',
        sourceType: 'simulation_decision',
        sourceId: 'e2',
        occurredAt: NOW + 1,
        scenarioContext: 'earnings',
        processMetrics: { processQuality: 28 },
      }),
    ];
    const plan = personalizeSimulationTraining({ records, mastery: scoreAllCompetencyMastery(records, NOW) });
    expect(plan.focus).toBe('event_adaptation');
    expect(plan.preferredEventKind).toBe('earnings');
  });

  it('lets an explicit handoff win over inferred weakness', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const plan = personalizeSimulationTraining({
      records,
      mastery: scoreAllCompetencyMastery(records, NOW),
      explicit: { focus: 'event_adaptation', preferredEventKind: 'rate_decision', concealConcept: true },
    });
    expect(plan.focus).toBe('event_adaptation');
    expect(plan.preferredEventKind).toBe('rate_decision');
    expect(plan.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
  });

  it('does not personalize when there is no learner gap and no prior book', () => {
    const plan = personalizeSimulationTraining({ records: [], mastery: [] });
    expect(plan.personalized).toBe(false);
    expect(plan.focus).toBeUndefined();
    expect(plan.trainingRationale).toBeUndefined();
  });

  it('builds focused books that stay stochastic and unlabeled as signals', () => {
    const scenario = generateSimulationScenario({
      userId: 'learner',
      now: '2026-09-10T00:00:00.000Z',
      seed: 41,
      focus: 'fomo_chase',
    });
    expect(scenario.decisionWindows.some((item) => item.kind === 'extended_move')).toBe(true);
    expect(scenario.climate.sentiment).toBe('complacent');
    expect(scenario.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
    const blob = `${scenario.trainingRationale} ${scenario.events.map((item) => item.briefing).join(' ')} ${scenario.decisionWindows.map((item) => item.prompt).join(' ')}`.toLowerCase();
    expect(blob).not.toMatch(/buy this|sell this|guaranteed|correct trade|best trade/);

    const invalidation = generateSimulationScenario({
      userId: 'learner',
      now: '2026-09-10T00:00:00.000Z',
      seed: 17,
      focus: 'invalidation_discipline',
    });
    expect(invalidation.decisionWindows.some((item) => item.kind === 'invalidation_check')).toBe(true);

    const sized = generateSimulationScenario({
      userId: 'learner',
      now: '2026-09-10T00:00:00.000Z',
      seed: 19,
      focus: 'position_sizing',
    });
    expect(sized.climate.liquidity).toBe('thin');
    expect(sized.complexity.volatility).toBeGreaterThan(0.4);
    expect(sized.decisionWindows.some((item) => item.kind === 'vol_spike')).toBe(true);

    const over = generateSimulationScenario({
      userId: 'learner',
      now: '2026-09-10T00:00:00.000Z',
      seed: 23,
      focus: 'overconfidence',
      difficulty: 'intermediate',
    });
    expect(over.events[0]?.briefing.toLowerCase()).toMatch(/consensus|consistent/);
    expect(over.events.some((item, index) => index > 0 && /conflict/i.test(item.briefing))).toBe(true);

    const evented = generateSimulationScenario({
      userId: 'learner',
      now: '2026-09-10T00:00:00.000Z',
      seed: 3,
      focus: 'event_adaptation',
      preferredEventKind: 'earnings',
    });
    expect(evented.events[0]?.kind).toBe('earnings');
    expect(evented.climate.macro).toBe('uncertain');

    const view = publicScenarioView(scenario);
    expect(view.trainingRationale).toBe(GENERIC_SIMULATION_TRAINING_RATIONALE);
    expect(publicViewLeaks(view, scenario)).toEqual([]);
    expect(JSON.stringify(view).toLowerCase()).not.toContain('"focus"');
  });

  it('does not treat prior simulated P/L as a reason to pick a focus', () => {
    const started = createSimulationAccount({ userId: 'learner', now: '2026-09-10T00:00:00.000Z' });
    const withProcess: typeof started = {
      ...started,
      decisions: [
        {
          id: 'dec_1',
          accountId: started.id,
          symbol: 'BRIX',
          thesis: 'Size from the stop, not from the last close.',
          evidence: 'Range and a scheduled educational print.',
          invalidation: 'A close back through the range.',
          expectedRisk: '1% of equity',
          intendedPositionSize: '1% risk',
          confidence: 'medium',
          createdAt: '2026-09-10T00:00:00.000Z',
        },
      ],
    };
    const winning = { ...withProcess, totalReturn: 0.4, realizedPnL: 4_000 };
    const losing = { ...withProcess, totalReturn: -0.4, realizedPnL: -4_000 };
    expect(personalizeSimulationTraining({ prior: winning }).focus).toBe(
      personalizeSimulationTraining({ prior: losing }).focus,
    );
    expect(personalizeSimulationTraining({ prior: winning }).personalized).toBe(false);
  });
});
