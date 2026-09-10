import {
  createEvidenceRecord,
  scoreAllCompetencyMastery,
  useCompetencyEvidenceStore,
} from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';
import { DEMO_USER_UID } from '@/firebase/config';
import { CLOUD_AI_ENABLED } from '@/features/ai/constants/ai-release';

import {
  composeLearnerModel,
  getLearnerConcept,
  snapshotContainsProseLeak,
  toAnalyticsSafeLearnerSummary,
  toMentorSafeLearnerSummary,
  useLearnerBehaviorStore,
} from '@/features/learner-model';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function ev(
  uid: string,
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    uid,
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    ...partial,
  });
}

describe('learner model', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
    useLearnerBehaviorStore.getState().resetAll();
  });

  it('does not treat lesson completion as mastery', () => {
    const records = [
      ev('user-a', {
        conceptId: 'rsi',
        sourceType: 'lesson_completion',
        sourceId: 'ta-rsi',
        result: 'observed',
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const rsi = getLearnerConcept(model, 'rsi');
    expect(rsi?.state).toBe('learning');
    expect(rsi?.state).not.toBe('demonstrated');
    expect(rsi?.state).not.toBe('strong');
    expect(JSON.stringify(model)).not.toMatch(/Trading Mastery/i);
    expect(model).not.toHaveProperty('masteryPercent');
  });

  it('keeps knowledge without application out of demonstrated / strong', () => {
    const records = [
      ev('user-a', {
        conceptId: 'rsi',
        sourceType: 'lesson_completion',
        sourceId: 'ta-rsi',
        occurredAt: NOW - 2 * DAY,
        result: 'observed',
      }),
      ev('user-a', {
        conceptId: 'rsi',
        sourceType: 'knowledge_check',
        sourceId: 'quiz-1',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'rsi',
        sourceType: 'knowledge_check',
        sourceId: 'quiz-2',
        result: 'pass',
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const rsi = getLearnerConcept(model, 'rsi')!;
    expect(['learning', 'developing']).toContain(rsi.state);
    expect(rsi.application.simulationDecisions).toBe(0);
    expect(rsi.application.replayDecisions).toBe(0);
    expect(model.explanation.currentlyUnderstands.length + model.explanation.uncertain.length).toBeGreaterThan(0);
    expect(rsi.state).not.toBe('strong');
    expect(rsi.state).not.toBe('demonstrated');
  });

  it('credits application even when quizzes are imperfect', () => {
    const records = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'quiz-miss',
        occurredAt: NOW - 4 * DAY,
        result: 'fail',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'drill-1',
        occurredAt: NOW - 3 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'sim-1',
        occurredAt: NOW - DAY,
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 80, thesis: 82, invalidation: 78, simulatedProfitable: false },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(model, 'invalidation')!;
    expect(row.application.simulationDecisions).toBe(1);
    expect(row.knowledge.knowledgeCheckPassRate).toBe(0);
    expect(row.state).not.toBe('strong');
    expect(model.decisionQuality.thesisClarity).toBeGreaterThan(0);
  });

  it('counts a good-process losing simulation as application, not a P/L grade', () => {
    const records = [
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'sim-lose',
        difficulty: 'complex',
        scenarioContext: 'losing_position',
        processMetrics: {
          processQuality: 86,
          thesis: 88,
          evidence: 80,
          invalidation: 84,
          risk: 82,
          simulatedPnl: -40,
          simulatedProfitable: false,
        },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(model, 'thesis')!;
    expect(row.application.simulationDecisions).toBe(1);
    expect(row.application.independentApplicationPasses).toBeGreaterThan(0);
    expect(model.decisionQuality.thesisClarity).toBeGreaterThanOrEqual(80);
  });

  it('does not let a bad-process winning simulation raise competence', () => {
    const records = [
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'sim-win',
        difficulty: 'complex',
        processMetrics: {
          processQuality: 22,
          thesis: 10,
          invalidation: 8,
          flags: { missingThesis: true, missingInvalidation: true, fomoEntry: true },
          simulatedPnl: 90,
          simulatedProfitable: true,
        },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(model, 'thesis')!;
    expect(row.application.independentApplicationPasses).toBe(0);
    expect(row.state).not.toBe('demonstrated');
    expect(row.state).not.toBe('strong');
    expect(row.knowledge.misconceptionFlags.length).toBeGreaterThan(0);
  });

  it('records help-dependent success without shaming copy', () => {
    const records = [
      ev('user-a', {
        conceptId: 'support',
        sourceType: 'practice_drill',
        sourceId: 'find-support',
        result: 'pass',
        helpLevel: 'hint',
        independent: false,
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(model, 'support')!;
    expect(row.helpDependent).toBe(true);
    expect(row.helpMix.hint).toBe(1);
    expect(model.explanation.helpReliance.toLowerCase()).not.toMatch(/shame|weak|failing learner|crutch/);
    expect(model.behavior.scaffolding).toBe('keep');
  });

  it('treats independent success as stronger evidence than helped success', () => {
    const helped = composeLearnerModel({
      uid: 'user-a',
      now: NOW,
      records: [
        ev('user-a', {
          conceptId: 'momentum',
          sourceType: 'practice_drill',
          sourceId: 'd1',
          result: 'pass',
          helpLevel: 'worked_solution',
          independent: false,
        }),
      ],
    });
    const independent = composeLearnerModel({
      uid: 'user-a',
      now: NOW,
      records: [
        ev('user-a', {
          conceptId: 'momentum',
          sourceType: 'practice_drill',
          sourceId: 'd1',
          result: 'pass',
          helpLevel: 'none',
        }),
      ],
    });
    expect(getLearnerConcept(helped, 'momentum')?.application.independentApplicationPasses).toBe(0);
    expect(getLearnerConcept(independent, 'momentum')?.application.independentApplicationPasses).toBe(1);
    expect(independent.behavior.scaffolding).toBe('independent');
  });

  it('marks evidence stale when an old demonstration is due for review', () => {
    const at = NOW - 60 * DAY;
    const records = [
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'quiz',
        occurredAt: at - 5 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'calculation_exercise',
        sourceId: 'calc',
        occurredAt: at - 4 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-trend',
        occurredAt: at - 3 * DAY,
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 82, simulatedProfitable: false },
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-vol',
        occurredAt: at,
        difficulty: 'complex',
        scenarioContext: 'high_volatility',
        processMetrics: { processQuality: 80, simulatedProfitable: true },
      }),
    ];
    expect(scoreAllCompetencyMastery(records, at).find((row) => row.conceptId === 'position-sizing')?.state).toBe(
      'demonstrated',
    );
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(model, 'position-sizing')!;
    expect(row.state).toBe('needs_revisit');
    expect(row.evidenceStale).toBe(true);
    expect(model.explanation.staleEvidence.length).toBeGreaterThan(0);
  });

  it('tracks transfer across contexts, conditions, and asset classes', () => {
    const records = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'sim-eq',
        occurredAt: NOW - 2 * DAY,
        difficulty: 'complex',
        scenarioContext: 'trend',
        assetClass: 'equity',
        interactingConceptIds: ['invalidation', 'thesis'],
        processMetrics: { processQuality: 80 },
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'sim-eq',
        occurredAt: NOW - 2 * DAY,
        difficulty: 'complex',
        scenarioContext: 'trend',
        assetClass: 'equity',
        interactingConceptIds: ['invalidation', 'thesis'],
        processMetrics: { processQuality: 80 },
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'sim-fx',
        difficulty: 'complex',
        scenarioContext: 'high_volatility',
        assetClass: 'fx',
        interactingConceptIds: ['invalidation', 'event-risk'],
        processMetrics: { processQuality: 81 },
      }),
    ];
    const oneContext = composeLearnerModel({ uid: 'user-a', records: records.slice(0, 2), now: NOW });
    expect(getLearnerConcept(oneContext, 'invalidation')?.state).toBe('transfer_unproven');
    const transferred = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const row = getLearnerConcept(transferred, 'invalidation')!;
    expect(row.transfer.assetClasses).toEqual(expect.arrayContaining(['equity', 'fx']));
    expect(row.transfer.marketConditions.length).toBeGreaterThanOrEqual(2);
    expect(row.transfer.multiConceptSourceIds.length).toBeGreaterThan(0);
    expect(row.state).not.toBe('transfer_unproven');
  });

  it('isolates users and supports the guest uid', () => {
    const alice = ev('alice', { conceptId: 'rsi', sourceType: 'knowledge_check', sourceId: 'q', result: 'pass' });
    const bob = ev('bob', { conceptId: 'rsi', sourceType: 'knowledge_check', sourceId: 'q', result: 'fail' });
    const guest = ev(DEMO_USER_UID, {
      conceptId: 'rsi',
      sourceType: 'lesson_completion',
      sourceId: 'ta-rsi',
      result: 'observed',
    });
    const aliceModel = composeLearnerModel({ uid: 'alice', records: [alice, bob, guest], now: NOW });
    const bobModel = composeLearnerModel({ uid: 'bob', records: [alice, bob, guest], now: NOW });
    const guestModel = composeLearnerModel({ uid: DEMO_USER_UID, records: [alice, bob, guest], now: NOW });
    expect(getLearnerConcept(aliceModel, 'rsi')?.knowledge.knowledgeCheckPassRate).toBe(100);
    expect(getLearnerConcept(bobModel, 'rsi')?.knowledge.knowledgeCheckPassRate).toBe(0);
    expect(getLearnerConcept(guestModel, 'rsi')?.state).toBe('learning');
    expect(aliceModel.uid).toBe('alice');
    expect(guestModel.uid).toBe(DEMO_USER_UID);
  });

  it('persists evidence and behavior, then recomposes the same snapshot', () => {
    const input: CompetencyEvidenceInput = {
      uid: 'user-a',
      conceptId: 'volume',
      sourceType: 'practice_drill',
      sourceId: 'vol-1',
      occurredAt: NOW,
      result: 'pass',
      helpLevel: 'example',
    };
    useCompetencyEvidenceStore.getState().recordEvidence(input);
    useLearnerBehaviorStore.getState().recordEvent({
      uid: 'user-a',
      type: 'explanation_opened',
      occurredAt: NOW,
      conceptId: 'volume',
      helpLevel: 'example',
    });
    const records = useCompetencyEvidenceStore.getState().evidenceFor('user-a');
    const events = useLearnerBehaviorStore.getState().eventsFor('user-a');
    const first = composeLearnerModel({
      uid: 'user-a',
      records,
      now: NOW,
      behaviorEvents: events,
    });
    const serialized = JSON.parse(JSON.stringify(records)) as CompetencyEvidenceRecord[];
    const second = composeLearnerModel({
      uid: 'user-a',
      records: serialized,
      now: NOW,
      behaviorEvents: JSON.parse(JSON.stringify(events)),
    });
    expect(second.concepts).toEqual(first.concepts);
    expect(second.behavior.explanationUsage).toBeGreaterThan(0);
    expect(first.concepts[0]?.helpMix.example).toBe(1);
  });

  it('keeps a single self-confidence report separate from competence', () => {
    const records = [
      ev('user-a', { conceptId: 'rsi', sourceType: 'knowledge_check', sourceId: 'q', result: 'pass' }),
    ];
    const model = composeLearnerModel({
      uid: 'user-a',
      records,
      now: NOW,
      selfConfidenceReports: [{ id: 'sc1', uid: 'user-a', occurredAt: NOW, value: 95 }],
    });
    expect(model.selfConfidence.interpreted).toBe(false);
    expect(model.selfConfidence.latest).toBe(95);
    expect(getLearnerConcept(model, 'rsi')?.state).not.toBe('strong');
  });

  it('never stores journal prose on the model or analytics / mentor summaries', () => {
    const records = [
      ev('user-a', {
        conceptId: 'journaling',
        sourceType: 'journal_reflection',
        sourceId: 'j1',
        result: 'pass',
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    expect(snapshotContainsProseLeak(model)).toBe(false);
    const analytics = toAnalyticsSafeLearnerSummary(model);
    expect(snapshotContainsProseLeak(analytics)).toBe(false);
    expect(analytics).not.toHaveProperty('uid');
    const mentor = toMentorSafeLearnerSummary(model);
    expect(JSON.stringify(mentor)).not.toMatch(/lessonsLearned|journalBody/);
    expect(CLOUD_AI_ENABLED).toBe(false);
  });

  it('answers the explainability questions without a trophy score', () => {
    const records = [
      ev('user-a', {
        conceptId: 'rsi',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 40, flags: { missingInvalidation: true } },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    expect(model.explanation.currentlyUnderstands.length + model.explanation.uncertain.length).toBeGreaterThan(0);
    expect(model.explanation.weak.length + model.explanation.practiceNext.length).toBeGreaterThan(0);
    expect(model.nextPractice.length).toBeGreaterThan(0);
    expect(JSON.stringify(model.explanation)).not.toMatch(/%/);
  });

  it('derives a private mistake library from structured flags', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 's2',
        occurredAt: NOW + 1000,
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW + 1000 });
    expect(model.mistakePatterns.patterns.some((row) => row.patternId === 'fomo_chase')).toBe(true);
    expect(model.mistakePatterns.patterns[0]?.summary).toMatch(/shortly after missing a move/i);
    expect(JSON.stringify(toAnalyticsSafeLearnerSummary(model))).not.toMatch(/fomo_chase|revenge|overconfidence/);
  });

  it('tracks a longitudinal profile without a trophy score', () => {
    const records = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q1',
        occurredAt: NOW - 20 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        occurredAt: NOW - 10 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        occurredAt: NOW,
        result: 'pass',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW });
    const slice = model.longitudinal.concepts.find((row) => row.conceptId === 'invalidation');
    expect(model.longitudinal.firstEvidenceAt).toBe(NOW - 20 * DAY);
    expect(slice?.strongestEvidence).not.toBeNull();
    expect(slice?.mostRecentEvidenceAt).toBe(NOW);
    expect(slice?.evidenceDiversity.formatCount).toBeGreaterThan(1);
    expect(JSON.stringify(model.longitudinal)).not.toMatch(/Trading Mastery/i);
  });
});
