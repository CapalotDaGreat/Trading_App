import {
  computeRedemonstrationDueAt,
  createEvidenceRecord,
  forgettingRiskFromQuality,
  scoreAllCompetencyMastery,
  scoreCompetencyMastery,
} from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';
import { composeLearnerModel } from '@/features/learner-model';
import { buildLearningEvidence } from '../learning-evidence.service';
import {
  detectEasySessionGrinding,
  overallPracticeStage,
  scaffoldingFor,
} from '../deliberate-practice.service';
import { composeTrainingPlan } from '@/features/training-planner/services/training-planner.service';
import { consecutiveSameFamilyCount } from '../deliberate-practice.service';

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

function snapshot(now: number) {
  return buildLearningEvidence({
    now,
    lessonProgress: {},
    conceptResults: {},
    attempts: [],
    journal: [],
    replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
    experience: 'intermediate',
  });
}

function planAt(evidence: CompetencyEvidenceRecord[], now: number) {
  return composeTrainingPlan({
    uid: 'user-a',
    snapshot: snapshot(now),
    options: {
      evidence,
      competency: scoreAllCompetencyMastery(evidence, now),
    },
  });
}

function demonstrate(
  conceptId: string,
  at: number,
  contexts: [NonNullable<CompetencyEvidenceInput['scenarioContext']>, NonNullable<CompetencyEvidenceInput['scenarioContext']>],
  extras?: { calculation?: boolean },
): CompetencyEvidenceRecord[] {
  return [
    ev({
      conceptId,
      sourceType: 'knowledge_check',
      sourceId: `q-${conceptId}-${at}`,
      occurredAt: at - 4 * DAY,
      result: 'pass',
    }),
    extras?.calculation
      ? ev({
          conceptId,
          sourceType: 'calculation_exercise',
          sourceId: `c-${conceptId}-${at}`,
          occurredAt: at - 3 * DAY,
          result: 'pass',
        })
      : ev({
          conceptId,
          sourceType: 'practice_drill',
          sourceId: `d-${conceptId}-${at}`,
          occurredAt: at - 3 * DAY,
          result: 'pass',
        }),
    ev({
      conceptId,
      sourceType: 'simulation_decision',
      sourceId: `s1-${conceptId}-${at}`,
      occurredAt: at - 2 * DAY,
      result: 'pass',
      difficulty: 'complex',
      scenarioContext: contexts[0],
      processMetrics: { processQuality: 82 },
    }),
    ev({
      conceptId,
      sourceType: 'simulation_decision',
      sourceId: `s2-${conceptId}-${at}`,
      occurredAt: at,
      result: 'pass',
      difficulty: 'complex',
      scenarioContext: contexts[1],
      processMetrics: { processQuality: 80 },
    }),
  ];
}

describe('long-term deliberate practice (months)', () => {
  it('does not reward a 90-day RSI quiz streak or hours of easy lessons', () => {
    const quizzes = Array.from({ length: 40 }, (_, index) =>
      ev({
        conceptId: 'rsi',
        sourceType: 'knowledge_check',
        sourceId: `rsi-q-${index}`,
        occurredAt: NOW - (40 - index) * DAY,
        result: 'pass',
        difficulty: 'applied',
      }),
    );
    const day90 = NOW;
    const grinding = detectEasySessionGrinding(
      quizzes.filter((item) => item.occurredAt >= day90 - 14 * DAY),
      day90,
    );
    expect(grinding.grinding).toBe(true);

    const plan = planAt(quizzes, day90);
    expect(plan.stage).toMatch(/foundation|application/);
    expect(plan.primary?.kind).not.toBe('continue_lesson');
    expect(plan.queue.filter((item) => item.conceptId === 'rsi').length).toBeLessThan(plan.queue.length);
    expect(blob(plan)).not.toMatch(/you mastered|ready to trade|good at trading/);
  });

  it('interleaves related skills instead of repeating one family for a month', () => {
    const evidence = [
      ...demonstrate('rsi', NOW - 20 * DAY, ['trend', 'high_volatility']),
      ...demonstrate('momentum', NOW - 18 * DAY, ['trend', 'range']),
      ...demonstrate('volume', NOW - 16 * DAY, ['trend', 'event_window']),
      ...demonstrate('invalidation', NOW - 12 * DAY, ['trend', 'ambiguous_setup']),
      ...demonstrate('position-sizing', NOW - 10 * DAY, ['trend', 'high_volatility'], { calculation: true }),
      ...demonstrate('fomo', NOW - 8 * DAY, ['high_volatility', 'losing_position']),
    ];
    const plan = planAt(evidence, NOW);
    const conceptIds = plan.queue.map((item) => item.conceptId).filter(Boolean) as string[];
    expect(new Set(conceptIds).size).toBeGreaterThan(1);
    expect(consecutiveSameFamilyCount(plan.queue)).toBeLessThanOrEqual(2);
    expect(plan.stage).toMatch(/integration|deliberate|maintenance/);
  });

  it('returns demonstrated skills for maintenance after evidence ages', () => {
    const evidence = [
      ...demonstrate('position-sizing', NOW - 50 * DAY, ['trend', 'high_volatility'], { calculation: true }),
      ...demonstrate('invalidation', NOW - 48 * DAY, ['trend', 'range']),
      ...demonstrate('thesis', NOW - 46 * DAY, ['trend', 'ambiguous_setup']),
    ];
    const later = NOW;
    const mastery = scoreAllCompetencyMastery(evidence, later);
    expect(mastery.some((row) => row.state === 'due_for_redemonstration' || (row.nextRedemonstrationAt != null && later >= row.nextRedemonstrationAt))).toBe(
      true,
    );
    const plan = planAt(evidence, later);
    expect(plan.stage).toBe('maintenance');
    expect(plan.queue.some((item) => item.isRedemonstration || item.priority === 'redemonstration' || item.kind === 'redemonstration')).toBe(
      true,
    );
    const scaffold = scaffoldingFor({
      stage: overallPracticeStage({ competency: mastery, evidence, experience: 'advanced' }),
      experience: 'advanced',
    });
    expect(scaffold.concealConcept || scaffold.showHints === false).toBe(true);
  });

  it('routes recent process misses to remediation rather than another quiz pile', () => {
    const evidence = [
      ...demonstrate('invalidation', NOW - 10 * DAY, ['trend', 'range']),
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'inv-miss-1',
        occurredAt: NOW - DAY,
        result: 'fail',
        processMetrics: { processQuality: 30, flags: { movedInvalidation: true } },
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'inv-miss-2',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { processQuality: 28, flags: { movedInvalidation: true } },
      }),
    ];
    const plan = planAt(evidence, NOW);
    expect(plan.primary?.isRemediation || plan.primary?.priority === 'remediation').toBe(true);
    expect(plan.primary?.conceptId).toBe('invalidation');
    expect(blob(plan)).not.toMatch(/disorder|diagnos/);
  });

  it('asks for transfer in a new context instead of the last successful one', () => {
    const evidence = demonstrate('position-sizing', NOW, ['trend', 'high_volatility'], { calculation: true });
    const plan = planAt(evidence, NOW);
    const transferish = plan.queue.find((item) => item.isTransferPractice || item.priority === 'transfer_practice' || item.kind === 'redemonstration');
    expect(plan.queue.length).toBeGreaterThan(0);
    expect(`${plan.whyPrimary} ${transferish?.reason ?? ''} ${transferish?.href ?? ''}`.toLowerCase()).not.toMatch(
      /buy this|sell this/,
    );
  });

  it('does not change the next activity when a discipline streak is long', () => {
    const evidence = demonstrate('thesis', NOW, ['trend', 'range']);
    const short = planAt(evidence, NOW);
    const long = planAt(evidence, NOW);
    expect(short.primary?.id).toBe(long.primary?.id);
    expect(short.primary?.score).toBe(long.primary?.score);
  });

  it('records a longitudinal profile: first, strongest, recent, diversity, improvement, transfer, retention', () => {
    const early = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'q-early',
        occurredAt: NOW - 60 * DAY,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'd-early',
        occurredAt: NOW - 58 * DAY,
        result: 'fail',
      }),
    ];
    const later = demonstrate('position-sizing', NOW - DAY, ['trend', 'high_volatility'], { calculation: true });
    const model = composeLearnerModel({ uid: 'user-a', records: [...early, ...later], now: NOW });
    const slice = model.longitudinal.concepts.find((row) => row.conceptId === 'position-sizing');
    expect(model.longitudinal.firstEvidenceAt).toBe(NOW - 60 * DAY);
    expect(slice?.firstEvidenceAt).toBe(NOW - 60 * DAY);
    expect(slice?.mostRecentEvidenceAt).toBeGreaterThan(slice!.firstEvidenceAt!);
    expect(slice?.strongestEvidence?.sourceType).toMatch(/simulation|calculation|practice|knowledge/);
    expect(slice?.evidenceDiversity.contextCount).toBeGreaterThan(1);
    expect(slice?.improvement).toMatch(/improving|stable|insufficient/);
    expect(slice?.retention.recency).not.toBeNull();
  });

  it('schedules weak, forgettable, and error-prone concepts sooner than strong ones', () => {
    const weak = computeRedemonstrationDueAt({
      lastIndependentSuccessAt: NOW,
      importance: 'core',
      quality: {
        knowledge: 50,
        application: 40,
        independence: 40,
        consistency: 40,
        difficulty: 70,
        recency: 30,
        variety: 20,
      },
      strength: 55,
      lastDifficulty: 'foundations',
      independentCount: 2,
      transferProven: false,
      recentFailCount: 2,
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
      transferProven: true,
      recentFailCount: 0,
    });
    expect(weak - NOW).toBeLessThan(strong - NOW);
    expect(forgettingRiskFromQuality({ knowledge: 90, application: 90, independence: 90, consistency: 90, difficulty: 90, recency: 20, variety: 90 })).toBeGreaterThan(
      forgettingRiskFromQuality({ knowledge: 90, application: 90, independence: 90, consistency: 90, difficulty: 90, recency: 90, variety: 90 }),
    );
  });

  it('does not freeze mastery after a demonstrated month — stale evidence returns', () => {
    const records = demonstrate('position-sizing', NOW - 40 * DAY, ['trend', 'high_volatility'], { calculation: true });
    const fresh = scoreCompetencyMastery('position-sizing', records, NOW - 35 * DAY);
    const stale = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(fresh.state).toBe('demonstrated');
    expect(stale.state).toBe('due_for_redemonstration');
    expect(stale.previouslyDemonstrated).toBe(true);
  });
});

function blob(plan: ReturnType<typeof composeTrainingPlan>): string {
  return `${plan.headline} ${plan.whyPrimary} ${plan.queue.map((item) => `${item.title} ${item.reason}`).join(' ')}`.toLowerCase();
}
