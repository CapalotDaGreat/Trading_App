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
    expect(later.userLabel).toBe('Due for review');
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
    expect(mastery.userLabel).toBe('Needs more practice');
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
