import {
  computeRedemonstrationDueAt,
  createEvidenceRecord,
  ingestPracticeAttempt,
  recipeFor,
  scoreCompetencyMastery,
  scoreEvidenceQuality,
  selectNextDemonstration,
  useCompetencyEvidenceStore,
} from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function ev(
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    uid: 'user-a',
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    ...partial,
  });
}

function sizingPath(at = NOW): CompetencyEvidenceRecord[] {
  return [
    ev({
      conceptId: 'position-sizing',
      sourceType: 'knowledge_check',
      sourceId: 'quiz',
      occurredAt: at - 5 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'calculation_exercise',
      sourceId: 'calc',
      occurredAt: at - 4 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'sim-trend',
      occurredAt: at - 3 * DAY,
      difficulty: 'complex',
      scenarioContext: 'trend',
      processMetrics: { processQuality: 82, simulatedProfitable: false, simulatedPnl: -30 },
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'sim-vol',
      occurredAt: at - DAY,
      difficulty: 'complex',
      scenarioContext: 'high_volatility',
      processMetrics: { processQuality: 80, simulatedProfitable: true, simulatedPnl: 40 },
    }),
  ];
}

describe('concept-specific demonstrated mastery', () => {
  it('requires mixed application contexts for position sizing', () => {
    const recipe = recipeFor('position-sizing');
    expect(recipe.requirements.some((item) => item.role === 'calculation')).toBe(true);
    expect(recipe.concealOnRetest).toBe(true);

    const oneContext = sizingPath().filter((item) => item.scenarioContext !== 'high_volatility');
    expect(scoreCompetencyMastery('position-sizing', oneContext, NOW).state).toBe('practiced');
    expect(scoreCompetencyMastery('position-sizing', sizingPath(), NOW).state).toBe('demonstrated');
  });

  it('lets journaling demonstrate from reflections without a simulation', () => {
    const records = [
      ev({
        conceptId: 'journaling',
        sourceType: 'journal_reflection',
        sourceId: 'j1',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'journaling',
        sourceType: 'journal_reflection',
        sourceId: 'j2',
        occurredAt: NOW,
        result: 'pass',
      }),
    ];
    expect(scoreCompetencyMastery('journaling', records, NOW).state).toBe('demonstrated');
  });

  it('does not expose a user-facing mastery percentage', () => {
    const mastery = scoreCompetencyMastery('position-sizing', sizingPath(), NOW);
    expect(mastery.userLabel).toBe('Demonstrated');
    expect(mastery.explanations.join(' ')).not.toMatch(/%|strength is \d/);
    expect(mastery.quality.application).not.toBeNull();
  });
});

describe('evidence quality and scheduling', () => {
  it('scores internal quality dimensions without using P/L', () => {
    const quality = scoreEvidenceQuality(sizingPath(), NOW);
    expect(quality.knowledge).toBeGreaterThan(0);
    expect(quality.application).toBeGreaterThan(0);
    expect(quality.independence).toBeGreaterThan(0);
    expect(quality.consistency).toBeGreaterThan(0);
  });

  it('returns a weak concept for review sooner than a consistently strong one', () => {
    const weak = computeRedemonstrationDueAt({
      lastIndependentSuccessAt: NOW,
      importance: 'core',
      quality: {
        knowledge: 50,
        application: 40,
        independence: 40,
        consistency: 40,
        difficulty: 70,
        recency: 80,
        variety: 25,
      },
      strength: 60,
      lastDifficulty: 'foundations',
      independentCount: 3,
    });
    const strong = computeRedemonstrationDueAt({
      lastIndependentSuccessAt: NOW,
      importance: 'core',
      quality: {
        knowledge: 90,
        application: 90,
        independence: 90,
        consistency: 90,
        difficulty: 90,
        recency: 90,
        variety: 90,
      },
      strength: 90,
      lastDifficulty: 'complex',
      independentCount: 6,
    });
    expect(weak - NOW).toBeLessThan(strong - NOW);
  });

  it('marks a demonstrated concept due for review after its own interval', () => {
    const later = scoreCompetencyMastery('position-sizing', sizingPath(NOW), NOW + 40 * DAY);
    expect(later.state).toBe('due_for_redemonstration');
    expect(later.competenceState).toBe('needs_revisit');
    expect(later.userLabel).toBe('Needs Revisit');
    expect(later.previouslyDemonstrated).toBe(true);
  });

  it('picks a mixed context that is not the last one used', () => {
    const prompt = selectNextDemonstration('position-sizing', sizingPath());
    expect(prompt.context).not.toBe('high_volatility');
    expect(prompt.concealConcept).toBe(true);
    expect(prompt.reason).not.toMatch(/position-sizing/i);
  });
});

describe('remediation and recovery', () => {
  it('needs more practice after repeated process misses, not after one miss', () => {
    const one = [
      ...sizingPath(),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
    ];
    expect(scoreCompetencyMastery('position-sizing', one, NOW).state).toBe('demonstrated');

    const repeated = [
      ...one,
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1000,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', repeated, NOW + 1000);
    expect(mastery.state).toBe('needs_remediation');
    expect(mastery.competenceState).toBe('needs_revisit');
    expect(mastery.userLabel).toBe('Needs Revisit');
    expect(mastery.remediation?.diagnosis).toMatch(/more risk than the written limit/i);
    expect(mastery.previouslyDemonstrated).toBe(true);
    expect(mastery.remediation?.steps.some((step) => step.kind === 'calculation')).toBe(true);
  });

  it('moves to practiced after successful remediation and keeps history', () => {
    const records = [
      ...sizingPath(NOW - 10 * DAY),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'm1',
        occurredAt: NOW - 2 * DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'm2',
        occurredAt: NOW - DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'remediation_exercise',
        sourceId: 'rem',
        occurredAt: NOW,
        result: 'pass',
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.state).toBe('practiced');
    expect(mastery.previouslyDemonstrated).toBe(true);
    expect(records).toHaveLength(7);
  });

  it('returns to demonstrated after a fresh independent re-test', () => {
    const records = [
      ...sizingPath(NOW - 10 * DAY),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'm1',
        occurredAt: NOW - 3 * DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'm2',
        occurredAt: NOW - 2 * DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'remediation_exercise',
        sourceId: 'rem',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 're_demonstration',
        sourceId: 'retest',
        occurredAt: NOW,
        difficulty: 'complex',
        scenarioContext: 'earnings',
        processMetrics: { processQuality: 84 },
      }),
    ];
    expect(scoreCompetencyMastery('position-sizing', records, NOW).state).toBe('demonstrated');
  });

  it('diagnoses FOMO as a behavioral pattern, not a medical condition', () => {
    const records = [
      ev({
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'a',
        occurredAt: NOW - DAY,
        result: 'fail',
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
      ev({
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'b',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
    ];
    const mastery = scoreCompetencyMastery('fomo', records, NOW);
    expect(mastery.state).toBe('needs_remediation');
    expect(mastery.remediation?.diagnosis).toMatch(/entering after rapid price movement/i);
    expect(mastery.remediation?.diagnosis).not.toMatch(/disorder|addiction|diagnos/i);
  });
});

describe('process versus simulated P/L', () => {
  it('does not reduce mastery for a losing simulation with strong process', () => {
    const records = [
      ...sizingPath(NOW - 2 * DAY),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'loss',
        occurredAt: NOW,
        difficulty: 'complex',
        scenarioContext: 'losing_position',
        processMetrics: { processQuality: 88, simulatedProfitable: false, simulatedPnl: -120 },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.state).toBe('demonstrated');
    expect(mastery.explanations.join(' ')).toMatch(/losing simulation with strong process/i);
  });

  it('treats a profitable weak-process decision as negative evidence', () => {
    const records = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'lucky',
        occurredAt: NOW - DAY,
        processMetrics: {
          processQuality: 20,
          simulatedProfitable: true,
          simulatedPnl: 500,
          flags: { exceededRiskLimit: true, missingInvalidation: true, fomoEntry: true },
        },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'lucky-2',
        occurredAt: NOW,
        processMetrics: {
          processQuality: 18,
          simulatedProfitable: true,
          simulatedPnl: 300,
          flags: { exceededRiskLimit: true },
        },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.state).toBe('needs_remediation');
    expect(mastery.explanations.join(' ')).toMatch(/profitable simulation with weak process/i);
  });

  it('keeps assisted attempts weaker than independent ones', () => {
    const assisted = sizingPath().map((item) =>
      createEvidenceRecord({
        ...item,
        independent: false,
        hintsUsed: true,
        eventKey: `${item.eventKey}:assisted`,
      }),
    );
    const mastery = scoreCompetencyMastery('position-sizing', assisted, NOW);
    expect(mastery.state).toBe('practiced');
    expect(mastery.independentDemonstrationCount).toBe(0);
    expect(mastery.quality.independence).toBeLessThan(50);
  });
});

describe('producer isolation', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('writes practice evidence for the acting user only', () => {
    ingestPracticeAttempt('alice', 'position-size', true, NOW);
    ingestPracticeAttempt('bob', 'position-size', false, NOW);
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')[0]?.result).toBe('pass');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('bob')[0]?.result).toBe('fail');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')[0]?.sourceType).toBe(
      'calculation_exercise',
    );
  });
});

describe('competence bands (primary representation)', () => {
  it('does not use a single numeric score as the user-facing state', () => {
    const mastery = scoreCompetencyMastery('position-sizing', sizingPath(), NOW);
    expect(mastery.competenceState).toBe('demonstrated');
    expect(mastery.userLabel).toBe('Demonstrated');
    expect(mastery.explanations.join(' ')).toMatch(/you demonstrated this skill/i);
    expect(mastery.explanations.join(' ')).not.toMatch(/ready to trade|advanced trader|safely trade/i);
    expect(typeof mastery.strength === 'number' || mastery.strength === null).toBe(true);
  });

  it('treats repeated independent success as stronger than a single pass', () => {
    const once = scoreCompetencyMastery(
      'momentum',
      [
        ev({
          conceptId: 'momentum',
          sourceType: 'practice_drill',
          sourceId: 'once',
          result: 'pass',
          occurredAt: NOW,
        }),
      ],
      NOW,
    );
    const repeated = scoreCompetencyMastery(
      'momentum',
      [
        ev({
          conceptId: 'momentum',
          sourceType: 'practice_drill',
          sourceId: 'r1',
          result: 'pass',
          occurredAt: NOW - 3 * DAY,
        }),
        ev({
          conceptId: 'momentum',
          sourceType: 'practice_drill',
          sourceId: 'r2',
          result: 'pass',
          occurredAt: NOW - 2 * DAY,
        }),
        ev({
          conceptId: 'momentum',
          sourceType: 'simulation_decision',
          sourceId: 's1',
          occurredAt: NOW,
          scenarioContext: 'trend',
          processMetrics: { processQuality: 80 },
        }),
      ],
      NOW,
    );
    expect(once.competenceState).not.toBe('demonstrated');
    expect(once.competenceState).not.toBe('strong');
    expect(repeated.competenceState).toBe('demonstrated');
    expect(repeated.independentDemonstrationCount).toBeGreaterThan(once.independentDemonstrationCount);
    expect(repeated.transfer.proven).toBe(true);
  });

  it('does not require perfection — intermittent success can still develop without collapsing', () => {
    const records = [
      ...sizingPath(NOW - 4 * DAY),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-once',
        occurredAt: NOW,
        result: 'fail',
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.state).toBe('demonstrated');
    expect(mastery.competenceState).toBe('demonstrated');
    expect(mastery.quality.consistency).not.toBe(100);
  });

  it('treats a successful guided exercise as weaker than an independent one', () => {
    const guided = [
      ev({
        conceptId: 'rsi',
        sourceType: 'applied_exercise',
        sourceId: 'guided',
        result: 'pass',
        independent: false,
        hintsUsed: true,
        helpLevel: 'example',
        occurredAt: NOW,
      }),
    ];
    const independent = [
      ev({
        conceptId: 'rsi',
        sourceType: 'applied_exercise',
        sourceId: 'solo',
        result: 'pass',
        independent: true,
        helpLevel: 'none',
        occurredAt: NOW,
      }),
    ];
    const guidedMastery = scoreCompetencyMastery('rsi', guided, NOW);
    const independentMastery = scoreCompetencyMastery('rsi', independent, NOW);
    expect(guidedMastery.independentDemonstrationCount).toBe(0);
    expect(independentMastery.independentDemonstrationCount).toBe(1);
    expect(guidedMastery.competenceState).toBe('developing');
    expect(independentMastery.competenceState).toBe('transfer_unproven');
    expect((independentMastery.strength ?? 0)).toBeGreaterThan(guidedMastery.strength ?? 0);
  });

  it('marks stale demonstrated evidence as needs revisit for spaced re-demonstration', () => {
    const later = scoreCompetencyMastery('position-sizing', sizingPath(NOW), NOW + 40 * DAY);
    expect(later.competenceState).toBe('needs_revisit');
    expect(later.revisitKind).toBe('retention');
    expect(later.explanations.join(' ')).toMatch(/retention, not punishment/i);
  });

  it('marks transfer unproven after a single-context application and proven after a new context', () => {
    const one = [
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'sim-trend',
        occurredAt: NOW,
        scenarioContext: 'trend',
        assetClass: 'equity',
        interactingConceptIds: ['invalidation', 'thesis'],
        processMetrics: { processQuality: 80 },
      }),
    ];
    const two = [
      ...one,
      ev({
        conceptId: 'invalidation',
        sourceType: 'replay_decision',
        sourceId: 'replay-fx',
        occurredAt: NOW + 1000,
        scenarioContext: 'high_volatility',
        assetClass: 'fx',
        interactingConceptIds: ['invalidation', 'event-risk'],
        processMetrics: { processQuality: 81 },
      }),
    ];
    expect(scoreCompetencyMastery('invalidation', one, NOW).competenceState).toBe('transfer_unproven');
    expect(scoreCompetencyMastery('invalidation', one, NOW).transfer.proven).toBe(false);
    const transferred = scoreCompetencyMastery('invalidation', two, NOW + 1000);
    expect(transferred.transfer.proven).toBe(true);
    expect(transferred.competenceState).not.toBe('transfer_unproven');
    expect(transferred.transfer.assetClasses).toEqual(expect.arrayContaining(['equity', 'fx']));
  });

  it('reaches strong only after repeated independent, varied application — not a perfect score', () => {
    const records = [
      ...sizingPath(NOW - 6 * DAY),
      ev({
        conceptId: 'position-sizing',
        sourceType: 're_demonstration',
        sourceId: 're-1',
        occurredAt: NOW - 2 * DAY,
        scenarioContext: 'event_window',
        assetClass: 'fx',
        processMetrics: { processQuality: 76 },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'replay_decision',
        sourceId: 'rp-1',
        occurredAt: NOW,
        scenarioContext: 'losing_position',
        assetClass: 'equity',
        processMetrics: { processQuality: 74 },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.state).toBe('demonstrated');
    expect(mastery.competenceState).toBe('strong');
    expect(mastery.userLabel).toBe('Strong');
    expect(mastery.explanations.join(' ')).toMatch(/evidence is strongest/i);
  });

  it('rotates remediation away from the same failed question and asks for a new-context verify', () => {
    const records = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'position-size',
        occurredAt: NOW - DAY,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'position-size',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.competenceState).toBe('needs_revisit');
    expect(mastery.remediation?.misconception?.label).toMatch(/more risk than the written limit/i);
    expect(mastery.remediation?.verifyInNewContext).toBe(true);
    expect(mastery.remediation?.steps.some((step) => step.sourceId === 'rr-compare')).toBe(true);
    expect(mastery.remediation?.steps.some((step) => step.kind === 'redemonstration')).toBe(true);
    expect(mastery.nextDemonstration?.context).not.toBe('standard');
  });

  it('keeps demonstrated skill when familiar application is strong and unfamiliar application is weak', () => {
    const records = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'quiz',
        occurredAt: NOW - 6 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'calculation_exercise',
        sourceId: 'calc',
        occurredAt: NOW - 5 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-trend',
        occurredAt: NOW - 4 * DAY,
        scenarioContext: 'trend',
        assetClass: 'equity',
        processMetrics: { processQuality: 82 },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-standard',
        occurredAt: NOW - 3 * DAY,
        scenarioContext: 'standard',
        assetClass: 'equity',
        processMetrics: { processQuality: 80 },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'replay_decision',
        sourceId: 'replay-fx',
        occurredAt: NOW - DAY,
        scenarioContext: 'high_volatility',
        assetClass: 'fx',
        transferDistance: 'far',
        processMetrics: { processQuality: 30 },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'transfer_exercise',
        sourceId: 'transfer-fx',
        occurredAt: NOW,
        scenarioContext: 'event_window',
        assetClass: 'fx',
        transferDistance: 'far',
        processMetrics: { processQuality: 28 },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(mastery.falseMastery).toBe(true);
    expect(mastery.state).toBe('demonstrated');
    expect(mastery.competenceState).toBe('demonstrated');
    expect(mastery.transfer.proven).toBe(false);
    expect(mastery.explanations.join(' ')).toMatch(/unfamiliar contexts/i);
    expect(mastery.nextDemonstration).not.toBeNull();
  });
});
