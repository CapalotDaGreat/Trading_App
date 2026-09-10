import {
  COMPETENCY_DISCLAIMER,
  COMPETENCY_FAMILIES,
  DEFAULT_RELIABILITY,
  REQUIRED_CONCEPT_GROUPS,
  createEvidenceForConcepts,
  createEvidenceRecord,
  evidenceFromJournalReflection,
  evidenceFromLessonCompletion,
  evidenceFromSimulationDecision,
  resolveCompetencyId,
  resolveEvidenceResult,
  scoreCompetencyMastery,
  useCompetencyEvidenceStore,
  validateTaxonomy,
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

function demonstratedPath(conceptId: string, at = NOW): CompetencyEvidenceRecord[] {
  return [
    ev({
      conceptId,
      sourceType: 'lesson_completion',
      sourceId: 'lesson-1',
      occurredAt: at - 4 * DAY,
      result: 'observed',
    }),
    ev({
      conceptId,
      sourceType: 'practice_drill',
      sourceId: 'drill-1',
      occurredAt: at - 3 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId,
      sourceType: 'practice_drill',
      sourceId: 'drill-2',
      occurredAt: at - 2 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId,
      sourceType: 'simulation_decision',
      sourceId: 'sim-1',
      occurredAt: at - DAY,
      difficulty: 'complex',
      processMetrics: { processQuality: 82, simulatedProfitable: false, simulatedPnl: -40 },
    }),
  ];
}

describe('competency taxonomy', () => {
  it('is internally valid and covers the required families', () => {
    const report = validateTaxonomy();
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
    for (const family of COMPETENCY_FAMILIES) {
      expect(REQUIRED_CONCEPT_GROUPS[family].length).toBeGreaterThan(0);
    }
  });

  it('resolves legacy aliases without colliding with canonical ids', () => {
    expect(resolveCompetencyId('position-sizing')).toBe('position-sizing');
    expect(resolveCompetencyId('chart-structure')).toBe('chart-interpretation');
    expect(resolveCompetencyId('drawdown')).toBe('drawdown-management');
    expect(resolveCompetencyId('revenge')).toBe('revenge-trading');
    expect(resolveCompetencyId('stops')).toBe('invalidation');
    expect(resolveCompetencyId('unknown-concept')).toBeNull();
  });
});

describe('evidence creation', () => {
  it('creates a typed record with process metadata and no journal prose', () => {
    const record = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'dec-1',
      occurredAt: NOW,
      difficulty: 'complex',
      hintsUsed: false,
      processMetrics: { processQuality: 74, simulatedPnl: 12, simulatedProfitable: true },
    });
    expect(record.conceptId).toBe('position-sizing');
    expect(record.sourceType).toBe('simulation_decision');
    expect(record.result).toBe('pass');
    expect(record.independent).toBe(true);
    expect(record.reliability).toBe(DEFAULT_RELIABILITY.simulation_decision);
    expect(record.version).toBe(1);
    expect(record).not.toHaveProperty('notes');
    expect(record).not.toHaveProperty('lessonsLearned');
  });

  it('rejects unknown concepts and empty uids', () => {
    expect(() =>
      createEvidenceRecord({
        uid: 'user-a',
        conceptId: 'not-a-concept',
        sourceType: 'practice_drill',
        sourceId: 'x',
      }),
    ).toThrow(/Unknown competency concept/);
    expect(() =>
      createEvidenceRecord({
        uid: '  ',
        conceptId: 'thesis',
        sourceType: 'practice_drill',
        sourceId: 'x',
      }),
    ).toThrow(/uid/);
  });

  it('attaches multiple concepts to one exercise', () => {
    const bundle = createEvidenceForConcepts(
      {
        uid: 'user-a',
        sourceType: 'practice_drill',
        sourceId: 'rr-compare',
        occurredAt: NOW,
        result: 'pass',
      },
      ['position-sizing', 'risk-per-trade'],
    );
    expect(bundle).toHaveLength(2);
    expect(bundle.map((item) => item.conceptId).sort()).toEqual(['position-sizing', 'risk-per-trade']);
    expect(new Set(bundle.map((item) => item.eventKey)).size).toBe(2);
  });

  it('does not store journal prose when ingesting a reflection', () => {
    const rows = evidenceFromJournalReflection({
      uid: 'user-a',
      sourceId: 'journal-1',
      occurredAt: NOW,
      mistakeCategory: 'size',
      planAdhered: false,
    });
    expect(rows.some((item) => item.conceptId === 'position-sizing')).toBe(true);
    expect(rows.some((item) => item.conceptId === 'following-a-plan')).toBe(true);
    for (const row of rows) {
      expect(JSON.stringify(row)).not.toMatch(/I chased the breakout/);
      expect(row).not.toHaveProperty('notes');
    }
  });
});

describe('process vs P/L', () => {
  it('treats profitable weak process as a fail', () => {
    expect(
      resolveEvidenceResult({
        uid: 'user-a',
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'sim-poor',
        processMetrics: { processQuality: 28, simulatedProfitable: true, simulatedPnl: 240 },
      }),
    ).toBe('fail');
  });

  it('treats losing strong process as a pass', () => {
    expect(
      resolveEvidenceResult({
        uid: 'user-a',
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'sim-strong',
        processMetrics: { processQuality: 88, simulatedProfitable: false, simulatedPnl: -90 },
      }),
    ).toBe('pass');
  });
});

describe('mastery transitions', () => {
  it('leaves a concept with no evidence as not_started', () => {
    const mastery = scoreCompetencyMastery('rsi', [], NOW);
    expect(mastery.state).toBe('not_started');
    expect(mastery.strength).toBeNull();
    expect(mastery.disclaimer).toBe(COMPETENCY_DISCLAIMER);
  });

  it('does not mark mastery from lesson completion alone', () => {
    const mastery = scoreCompetencyMastery(
      'support',
      evidenceFromLessonCompletion({
        uid: 'user-a',
        sourceId: 'ta-structure',
        conceptIds: ['support'],
        occurredAt: NOW,
      }),
      NOW,
    );
    expect(mastery.state).toBe('learning');
    expect(mastery.strength).toBeNull();
    expect(mastery.explanations.join(' ')).toMatch(/exposure/i);
  });

  it('treats a single quiz pass as insufficient for demonstrated', () => {
    const mastery = scoreCompetencyMastery(
      'rsi',
      [
        ev({
          conceptId: 'rsi',
          sourceType: 'knowledge_check',
          sourceId: 'quiz-1',
          result: 'pass',
        }),
      ],
      NOW,
    );
    expect(mastery.state).toBe('practiced');
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.independentDemonstrationCount).toBe(1);
  });

  it('reaches demonstrated only after the concept-specific evidence recipe is met', () => {
    const mastery = scoreCompetencyMastery('momentum', demonstratedPath('momentum'), NOW);
    expect(mastery.state).toBe('demonstrated');
    expect(mastery.userLabel).toBe('Demonstrated');
    expect(mastery.recipeMet).toBe(true);
    expect(mastery.explanations.join(' ')).not.toMatch(/certified|qualified|live-ready|ready for|expert|guaranteed/i);
  });

  it('does not treat two drills and one simulation as demonstrated for position sizing', () => {
    const mastery = scoreCompetencyMastery('position-sizing', demonstratedPath('position-sizing'), NOW);
    expect(mastery.state).toBe('practiced');
    expect(mastery.recipeMet).toBe(false);
    expect(mastery.missingRoles).toContain('application');
  });

  it('keeps assisted work weaker than independent work', () => {
    const assisted = [
      ev({
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        result: 'pass',
        hintsUsed: true,
        independent: false,
        occurredAt: NOW - 3 * DAY,
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd2',
        result: 'pass',
        hintsUsed: true,
        independent: false,
        occurredAt: NOW - 2 * DAY,
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        hintsUsed: true,
        independent: false,
        occurredAt: NOW - DAY,
        processMetrics: { processQuality: 80 },
      }),
    ];
    const mastery = scoreCompetencyMastery('invalidation', assisted, NOW);
    expect(mastery.state).toBe('practiced');
    expect(mastery.independentDemonstrationCount).toBe(0);
    expect(mastery.strength).toBeLessThan(
      scoreCompetencyMastery('position-sizing', demonstratedPath('position-sizing'), NOW).strength ?? 0,
    );
  });

  it('marks needs_remediation after repeated process misses', () => {
    const records = [
      ...demonstratedPath('thesis'),
      ev({
        conceptId: 'thesis',
        sourceType: 'practice_drill',
        sourceId: 'miss-1',
        occurredAt: NOW - 8 * 60 * 60 * 1000,
        result: 'fail',
      }),
      ev({
        conceptId: 'thesis',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW,
        result: 'fail',
      }),
    ];
    expect(scoreCompetencyMastery('thesis', records, NOW).state).toBe('needs_remediation');
  });

  it('leaves needs_remediation after a successful remediation exercise', () => {
    const records = [
      ev({
        conceptId: 'fomo',
        sourceType: 'practice_drill',
        sourceId: 'a',
        occurredAt: NOW - 2 * DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'fomo',
        sourceType: 'practice_drill',
        sourceId: 'b',
        occurredAt: NOW - DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'fomo',
        sourceType: 'remediation_exercise',
        sourceId: 'rem-1',
        occurredAt: NOW,
        result: 'pass',
      }),
    ];
    expect(scoreCompetencyMastery('fomo', records, NOW).state).toBe('practiced');
  });

  it('asks for re-demonstration when independent evidence ages out', () => {
    const records = demonstratedPath('momentum', NOW);
    const later = scoreCompetencyMastery('momentum', records, NOW + 30 * DAY);
    expect(later.state).toBe('due_for_redemonstration');
  });

  it('raises consistency when demonstrations repeat', () => {
    const once = scoreCompetencyMastery(
      'divergence',
      [
        ev({
          conceptId: 'divergence',
          sourceType: 'practice_drill',
          sourceId: 'once',
          result: 'pass',
          occurredAt: NOW,
        }),
        ev({
          conceptId: 'divergence',
          sourceType: 'practice_drill',
          sourceId: 'miss',
          result: 'fail',
          occurredAt: NOW + 1000,
        }),
      ],
      NOW + 2000,
    );
    const repeated = scoreCompetencyMastery(
      'divergence',
      [
        ev({
          conceptId: 'divergence',
          sourceType: 'practice_drill',
          sourceId: 'r1',
          result: 'pass',
          occurredAt: NOW,
        }),
        ev({
          conceptId: 'divergence',
          sourceType: 'practice_drill',
          sourceId: 'r2',
          result: 'pass',
          occurredAt: NOW + 1000,
        }),
        ev({
          conceptId: 'divergence',
          sourceType: 'practice_drill',
          sourceId: 'r3',
          result: 'pass',
          occurredAt: NOW + 2000,
        }),
      ],
      NOW + 3000,
    );
    expect(repeated.strength ?? 0).toBeGreaterThan(once.strength ?? 0);
    expect(repeated.demonstrationCount).toBeGreaterThan(once.demonstrationCount);
  });

  it('does not reward a profitable weak-process decision', () => {
    const mastery = scoreCompetencyMastery(
      'thesis',
      evidenceFromSimulationDecision({
        uid: 'user-a',
        sourceId: 'lucky-fill',
        conceptIds: ['thesis'],
        occurredAt: NOW,
        processQuality: 22,
        simulatedProfitable: true,
        simulatedPnl: 400,
      }),
      NOW,
    );
    expect(mastery.state).toBe('practiced');
    expect(mastery.explanations.join(' ')).toMatch(/profitable simulation with weak process/i);
    expect(mastery.state).not.toBe('demonstrated');
  });

  it('can credit a losing strong-process decision', () => {
    const mastery = scoreCompetencyMastery(
      'thesis',
      evidenceFromSimulationDecision({
        uid: 'user-a',
        sourceId: 'good-process-loss',
        conceptIds: ['thesis'],
        occurredAt: NOW,
        processQuality: 86,
        simulatedProfitable: false,
        simulatedPnl: -75,
      }),
      NOW,
    );
    expect(mastery.state).toBe('practiced');
    expect(mastery.strength).toBeGreaterThanOrEqual(70);
    expect(mastery.explanations.join(' ')).toMatch(/losing simulation with strong process/i);
  });
});

describe('competency store isolation', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('ignores duplicate event keys for the same user', () => {
    const input: CompetencyEvidenceInput = {
      uid: 'user-a',
      conceptId: 'volume',
      sourceType: 'practice_drill',
      sourceId: 'vol-1',
      occurredAt: NOW,
      result: 'pass',
      eventKey: 'user-a:practice_drill:vol-1:volume',
    };
    const first = useCompetencyEvidenceStore.getState().recordEvidence(input);
    const second = useCompetencyEvidenceStore.getState().recordEvidence(input);
    expect(first.status).toBe('recorded');
    expect(second.status).toBe('duplicate');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('user-a', 'volume')).toHaveLength(1);
  });

  it('keeps users isolated and reset does not leak the other ledger', () => {
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'alice',
      conceptId: 'earnings',
      sourceType: 'knowledge_check',
      sourceId: 'q1',
      occurredAt: NOW,
      result: 'pass',
    });
    useCompetencyEvidenceStore.getState().recordEvidence({
      uid: 'bob',
      conceptId: 'earnings',
      sourceType: 'knowledge_check',
      sourceId: 'q1',
      occurredAt: NOW,
      result: 'fail',
    });

    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')).toHaveLength(1);
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')[0]?.result).toBe('pass');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('bob')[0]?.result).toBe('fail');
    expect(useCompetencyEvidenceStore.getState().masteryFor('alice', 'earnings', NOW).state).toBe(
      'practiced',
    );
    expect(useCompetencyEvidenceStore.getState().masteryFor('bob', 'earnings', NOW).strength).toBe(0);

    useCompetencyEvidenceStore.getState().resetUser('alice');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')).toEqual([]);
    expect(useCompetencyEvidenceStore.getState().evidenceFor('bob')).toHaveLength(1);
  });

  it('rejects unauthenticated or empty-uid writes', () => {
    const result = useCompetencyEvidenceStore.getState().recordEvidence({
      uid: '',
      conceptId: 'thesis',
      sourceType: 'practice_drill',
      sourceId: 'x',
    });
    expect(result.status).toBe('rejected');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('')).toEqual([]);
  });
});
