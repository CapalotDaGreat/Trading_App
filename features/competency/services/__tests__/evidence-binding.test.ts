import { ALL_LESSONS } from '@/features/academy/content';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import {
  COMPETENCY_EVIDENCE_VERSION,
  conceptsForDrill,
  conceptsForLesson,
  createEvidenceRecord,
  evidenceFromJournalReflection,
  evidenceFromKnowledgeCheck,
  evidenceFromLessonCompletion,
  evidenceFromSimulationDecision,
  ingestJournalReflection,
  ingestKnowledgeCheck,
  ingestLessonCompletion,
  ingestLessonExercise,
  ingestPracticeAttempt,
  ingestSimulationCheckpoint,
  ingestSimulationDecision,
  ingestTransferExercise,
  isExposureOnlyRecord,
  isIndependentEvidence,
  journalSignalsFromFields,
  normalizeEvidenceRecord,
  resolveCompetencyId,
  scoreCompetencyMastery,
  sourceTypeForLessonExercise,
  useCompetencyEvidenceStore,
} from '@/features/competency';
import type { CompetencyEvidenceRecord } from '@/features/competency';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');

describe('canonical activity bindings', () => {
  it('maps every published lesson and drill onto known concept ids', () => {
    for (const lesson of ALL_LESSONS) {
      const ids = conceptsForLesson(lesson.id);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(resolveCompetencyId(id)).toBe(id);
      }
    }
    for (const drill of PRACTICE_DRILLS) {
      const ids = conceptsForDrill(drill.id);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(resolveCompetencyId(id)).toBe(id);
      }
    }
  });

  it('normalizes legacy labels onto the existing taxonomy', () => {
    expect(resolveCompetencyId('trend')).toBe('trend-identification');
    expect(resolveCompetencyId('breakout')).toBe('breakouts');
    expect(resolveCompetencyId('fakeout')).toBe('false-breakouts');
    expect(resolveCompetencyId('volatility')).toBe('volatility-aware-risk');
    expect(resolveCompetencyId('stop-loss')).toBe('invalidation');
    expect(resolveCompetencyId('moving-average')).toBe('moving-averages');
    expect(resolveCompetencyId('revenge')).toBe('revenge-trading');
    expect(resolveCompetencyId('cash-flow')).toBe('earnings');
    expect(resolveCompetencyId('margins')).toBe('earnings');
    expect(resolveCompetencyId('moat')).toBe('competitive-position');
  });
});

describe('completion is not mastery', () => {
  it('does not treat lesson completion as demonstrated skill', () => {
    const records = evidenceFromLessonCompletion({
      uid: 'user-a',
      sourceId: 'ta-rsi',
      conceptIds: conceptsForLesson('ta-rsi'),
      occurredAt: NOW,
    });
    expect(records.every((item) => item.evidenceLayer === 'completion')).toBe(true);
    expect(records.every((item) => isExposureOnlyRecord(item))).toBe(true);
    const mastery = scoreCompetencyMastery('rsi', records, NOW);
    expect(mastery.state).toBe('learning');
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.recipeMet).toBe(false);
  });

  it('keeps a quiz pass as knowledge evidence, not application', () => {
    const records = evidenceFromKnowledgeCheck({
      uid: 'user-a',
      sourceId: 'ta-rsi',
      conceptIds: ['rsi'],
      occurredAt: NOW,
      correct: true,
    });
    expect(records[0]?.evidenceLayer).toBe('recognition');
    expect(records[0]?.sourceType).toBe('knowledge_check');
    const mastery = scoreCompetencyMastery('rsi', records, NOW);
    expect(mastery.state).toBe('practiced');
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.quality.knowledge).not.toBeNull();
    expect(mastery.quality.application).toBeNull();
  });
});

describe('exercise independence and fundamentals', () => {
  it('maps multiple-choice kinds to knowledge and applied kinds to application', () => {
    expect(sourceTypeForLessonExercise('choose')).toBe('knowledge_check');
    expect(sourceTypeForLessonExercise('select')).toBe('knowledge_check');
    expect(sourceTypeForLessonExercise('scenario')).toBe('applied_exercise');
    expect(sourceTypeForLessonExercise('compare')).toBe('applied_exercise');
    expect(sourceTypeForLessonExercise('explain')).toBe('applied_exercise');
    expect(sourceTypeForLessonExercise('calculate')).toBe('calculation_exercise');
  });

  it('gives independent applied work a stronger application layer than guided work', () => {
    const guided = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'earnings',
      sourceType: 'applied_exercise',
      sourceId: 'fund-guided',
      occurredAt: NOW,
      result: 'pass',
      independent: false,
      hintsUsed: true,
      helpLevel: 'example',
    });
    const independent = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'earnings',
      sourceType: 'applied_exercise',
      sourceId: 'fund-solo',
      occurredAt: NOW,
      result: 'pass',
      independent: true,
      helpLevel: 'none',
      priorIndependentCount: 0,
    });
    expect(guided.evidenceLayer).toBe('guided_application');
    expect(independent.evidenceLayer).toBe('independent_application');
    expect(isIndependentEvidence(independent)).toBe(true);
    expect(isIndependentEvidence(guided)).toBe(false);
    expect(independent.reliability).toBeGreaterThan(guided.reliability);
  });

  it('does not grant fundamentals demonstration from a multiple-choice lesson pass', () => {
    const quiz = evidenceFromKnowledgeCheck({
      uid: 'user-a',
      sourceId: 'fund-statements',
      conceptIds: ['earnings'],
      occurredAt: NOW,
      correct: true,
    });
    const mcqExercise = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'earnings',
      sourceType: sourceTypeForLessonExercise('choose'),
      sourceId: 'fund-statements:exercise',
      occurredAt: NOW + 1,
      result: 'pass',
      independent: true,
    });
    const mastery = scoreCompetencyMastery('earnings', [...quiz, mcqExercise], NOW + 2);
    expect(mcqExercise.sourceType).toBe('knowledge_check');
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.missingRoles).toContain('application');
  });
});

describe('simulation process vs P/L', () => {
  it('records process evidence from a losing simulated outcome', () => {
    const rows = evidenceFromSimulationDecision({
      uid: 'user-a',
      sourceId: 'sim-loss',
      conceptIds: ['thesis'],
      occurredAt: NOW,
      processQuality: 84,
      simulatedProfitable: false,
      simulatedPnl: -120,
    });
    expect(rows[0]?.result).toBe('pass');
    expect(rows[0]?.evidenceLayer).toBe('independent_application');
    expect(rows[0]?.processMetrics?.simulatedProfitable).toBe(false);
    const mastery = scoreCompetencyMastery('thesis', rows, NOW);
    expect(mastery.state).not.toBe('not_started');
    expect(mastery.explanations.join(' ')).toMatch(/losing simulation with strong process/i);
  });

  it('does not let simulated profit dominate a weak process', () => {
    const rows = evidenceFromSimulationDecision({
      uid: 'user-a',
      sourceId: 'sim-luck',
      conceptIds: ['thesis'],
      occurredAt: NOW,
      processQuality: 20,
      simulatedProfitable: true,
      simulatedPnl: 500,
    });
    expect(rows[0]?.result).toBe('fail');
    const mastery = scoreCompetencyMastery('thesis', rows, NOW);
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.strength ?? 0).toBeLessThan(50);
  });
});

describe('journal structured flags', () => {
  it('does not treat journal completion alone as mastery', () => {
    const empty = journalSignalsFromFields({ quantity: 10, planAdhered: undefined });
    expect(empty.thesisPresent).toBe(false);
    expect(empty.invalidationPresent).toBe(false);
    const rows = [
      ...evidenceFromJournalReflection({
        uid: 'user-a',
        sourceId: 'j1',
        occurredAt: NOW - 1000,
      }),
      ...evidenceFromJournalReflection({
        uid: 'user-a',
        sourceId: 'j2',
        occurredAt: NOW,
      }),
    ];
    for (const row of rows) {
      expect(row.result).toBe('observed');
      expect(row.evidenceLayer).toBe('completion');
      expect(JSON.stringify(row)).not.toMatch(/notes|I felt greedy/);
    }
    expect(scoreCompetencyMastery('journaling', rows, NOW).state).not.toBe('demonstrated');
  });

  it('does not inspect free-form notes when building signals', () => {
    const signals = journalSignalsFromFields({
      strategy: 'Gap fade after the print',
      stopLoss: 12.4,
      quantity: 20,
      regimeNote: 'event window',
      lessonsLearned: 'present',
    });
    expect(signals.thesisPresent).toBe(true);
    expect(signals.thesisSpecificity).toBe('specific');
    expect(signals.invalidationPresent).toBe(true);
    expect(signals.riskConsidered).toBe(true);
    expect(signals.uncertaintyAcknowledged).toBe(true);
    expect(signals.reflectionCompleted).toBe(true);
  });
});

describe('transfer evidence', () => {
  it('marks far transfer as a stronger evidence layer than recognition', () => {
    const quiz = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'invalidation',
      sourceType: 'knowledge_check',
      sourceId: 'q',
      occurredAt: NOW,
      result: 'pass',
      independent: true,
    });
    const transfer = createEvidenceRecord({
      uid: 'user-a',
      conceptId: 'invalidation',
      sourceType: 'transfer_exercise',
      sourceId: 'transfer-invalidation',
      occurredAt: NOW + 1,
      result: 'pass',
      independent: true,
      scenarioContext: 'event_window',
      assetClass: 'fx',
    });
    expect(quiz.evidenceLayer).toBe('recognition');
    expect(transfer.evidenceLayer).toBe('transfer');
    expect(transfer.transferDistance).toBe('far');
    expect(transfer.reliability).toBeGreaterThan(quiz.reliability);
  });
});

describe('legacy records stay intact', () => {
  it('normalizes old records as historical or completion without upgrading them', () => {
    const v1 = {
      ...createEvidenceRecord({
        uid: 'user-a',
        conceptId: 'rsi',
        sourceType: 'lesson_completion',
        sourceId: 'ta-rsi',
        occurredAt: NOW,
        result: 'observed',
      }),
      version: 1 as const,
    };
    delete (v1 as { evidenceLayer?: string }).evidenceLayer;
    delete (v1 as { transferDistance?: string }).transferDistance;
    delete (v1 as { helpLevel?: string }).helpLevel;
    const normalized = normalizeEvidenceRecord(v1 as CompetencyEvidenceRecord);
    expect(normalized.result).toBe('observed');
    expect(normalized.conceptId).toBe('rsi');
    expect(normalized.evidenceLayer).toBe('historical');
    expect(normalized.transferDistance).toBe('none');
    expect(normalized.evidenceLayer).not.toBe('transfer');
    expect(normalized.evidenceLayer).not.toBe('retention');
    expect(normalized.evidenceLayer).not.toBe('repeated_application');
  });

  it('still scores a previously valid demonstration path as demonstrated', () => {
    const records = [
      createEvidenceRecord({
        uid: 'user-a',
        conceptId: 'momentum',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        occurredAt: NOW - 3,
        result: 'pass',
        independent: true,
      }),
      createEvidenceRecord({
        uid: 'user-a',
        conceptId: 'momentum',
        sourceType: 'practice_drill',
        sourceId: 'd2',
        occurredAt: NOW - 2,
        result: 'pass',
        independent: true,
      }),
      createEvidenceRecord({
        uid: 'user-a',
        conceptId: 'momentum',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        occurredAt: NOW - 1,
        independent: true,
        processMetrics: { processQuality: 82, simulatedProfitable: false, simulatedPnl: -40 },
      }),
    ];
    expect(scoreCompetencyMastery('momentum', records, NOW).state).toBe('demonstrated');
  });
});

describe('user-scoped evidence ingest', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('keeps evidence isolated per uid and records simulation checkpoints as process', () => {
    ingestLessonCompletion('alice', 'ta-rsi', NOW);
    ingestKnowledgeCheck('alice', 'ta-rsi', 'rsi', true, NOW + 1);
    ingestLessonExercise('alice', 'fund-statements', 'earnings', true, NOW + 2, {
      kind: 'scenario',
      exerciseId: 'ex-fs-margins',
    });
    ingestPracticeAttempt('alice', 'identify-trend', true, NOW + 3);
    ingestSimulationDecision({
      uid: 'alice',
      sourceId: 'fill-1',
      occurredAt: NOW + 4,
      processQuality: 80,
      simulatedPnl: -15,
      simulatedProfitable: false,
    });
    ingestSimulationCheckpoint({
      uid: 'alice',
      sourceId: 'window-1',
      option: 'reduce',
      reasoningPresent: true,
      windowKind: 'event_eve',
      occurredAt: NOW + 5,
      simulatedPnl: -15,
      simulatedProfitable: false,
    });
    ingestTransferExercise({
      uid: 'alice',
      sourceId: 'transfer-thesis',
      conceptIds: ['thesis'],
      occurredAt: NOW + 6,
      correct: true,
    });
    ingestJournalReflection({ uid: 'alice', sourceId: 'empty-journal', occurredAt: NOW + 7 });
    ingestKnowledgeCheck('bob', 'ta-rsi', 'rsi', false, NOW + 8);

    const alice = useCompetencyEvidenceStore.getState().evidenceFor('alice');
    const bob = useCompetencyEvidenceStore.getState().evidenceFor('bob');
    expect(alice.every((item) => item.uid === 'alice')).toBe(true);
    expect(bob.every((item) => item.uid === 'bob')).toBe(true);
    expect(alice.some((item) => item.sourceType === 'lesson_completion')).toBe(true);
    expect(alice.some((item) => item.sourceType === 'knowledge_check' && item.evidenceLayer === 'recognition')).toBe(
      true,
    );
    expect(alice.some((item) => item.sourceType === 'applied_exercise')).toBe(true);
    expect(alice.some((item) => item.conceptId === 'trend-identification')).toBe(true);
    expect(alice.some((item) => item.sourceType === 'simulation_decision' && item.result === 'pass')).toBe(true);
    expect(alice.some((item) => item.sourceType === 'simulation_checkpoint')).toBe(true);
    expect(alice.some((item) => item.sourceType === 'transfer_exercise' && item.transferDistance === 'far')).toBe(true);
    expect(
      alice.filter((item) => item.conceptId === 'journaling').every((item) => item.evidenceLayer === 'completion'),
    ).toBe(true);
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice', 'rsi')).not.toEqual(
      useCompetencyEvidenceStore.getState().evidenceFor('bob', 'rsi'),
    );
    expect(useCompetencyEvidenceStore.getState().masteryFor('bob', 'rsi', NOW + 9).strength).toBe(0);
    expect(COMPETENCY_EVIDENCE_VERSION).toBe(2);
  });
});
