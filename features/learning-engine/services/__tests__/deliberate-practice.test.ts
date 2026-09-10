import {
  createEvidenceRecord,
  scoreAllCompetencyMastery,
  scoreCompetencyMastery,
  scoreEvidenceQuality,
  selectTransferContext,
} from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';

import { buildLearningEvidence } from '../learning-evidence.service';
import {
  conceptPracticeStage,
  consecutiveSameFamilyCount,
  detectEasySessionGrinding,
  interleaveByFamily,
  overallPracticeStage,
  practiceStagePolicy,
  scaffoldingFor,
} from '../deliberate-practice.service';
import { composeTodaysTraining } from '../today-training-engine.service';

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

function emptySnapshot(extra: Partial<Parameters<typeof buildLearningEvidence>[0]> = {}) {
  return buildLearningEvidence({
    now: NOW,
    lessonProgress: {},
    conceptResults: {},
    attempts: [],
    journal: [],
    replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
    ...extra,
  });
}

function independentApp(
  conceptId: string,
  context: CompetencyEvidenceInput['scenarioContext'],
  at: number,
  sourceId: string,
): CompetencyEvidenceRecord {
  return ev({
    conceptId,
    sourceType: 'simulation_decision',
    sourceId,
    occurredAt: at,
    result: 'pass',
    difficulty: 'complex',
    scenarioContext: context,
    processMetrics: { processQuality: 80 },
  });
}

describe('stage progression', () => {
  it('starts at foundation and moves through application, integration, deliberate, then maintenance', () => {
    expect(
      overallPracticeStage({ competency: [], evidence: [], experience: 'beginner' }),
    ).toBe('foundation');

    const exposed = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'lesson_completion',
        sourceId: 'lesson',
        result: 'observed',
      }),
    ];
    expect(
      overallPracticeStage({
        competency: scoreAllCompetencyMastery(exposed, NOW),
        evidence: exposed,
        experience: 'beginner',
      }),
    ).toBe('foundation');

    const practiced = [
      ...exposed,
      ev({
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'd',
        result: 'fail',
      }),
    ];
    expect(
      overallPracticeStage({
        competency: scoreAllCompetencyMastery(practiced, NOW),
        evidence: practiced,
        experience: 'intermediate',
      }),
    ).toBe('application');

    const applied = [
      ev({
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q-inv',
        result: 'pass',
        occurredAt: NOW - 4 * DAY,
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd-inv',
        result: 'pass',
        occurredAt: NOW - 3 * DAY,
      }),
      independentApp('invalidation', 'trend', NOW - 2 * DAY, 'sim-inv'),
      ev({
        conceptId: 'thesis',
        sourceType: 'knowledge_check',
        sourceId: 'q-th',
        result: 'pass',
        occurredAt: NOW - DAY,
      }),
      independentApp('thesis', 'range', NOW, 'sim-th'),
    ];
    const appliedMastery = scoreAllCompetencyMastery(applied, NOW);
    expect(
      overallPracticeStage({
        competency: appliedMastery,
        evidence: applied,
        experience: 'intermediate',
      }),
    ).toMatch(/application|integration|deliberate/);

    const demonstratedBundle = ['position-sizing', 'invalidation', 'thesis'].flatMap((conceptId, index) => [
      ev({
        conceptId,
        sourceType: 'knowledge_check',
        sourceId: `q-${conceptId}`,
        occurredAt: NOW - 6 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId,
        sourceType: 'calculation_exercise',
        sourceId: `c-${conceptId}`,
        occurredAt: NOW - 5 * DAY,
        result: 'pass',
      }),
      independentApp(conceptId, index === 0 ? 'trend' : 'high_volatility', NOW - 4 * DAY, `s1-${conceptId}`),
      independentApp(conceptId, index === 0 ? 'high_volatility' : 'range', NOW - 3 * DAY, `s2-${conceptId}`),
    ]);
    const demonstratedMastery = scoreAllCompetencyMastery(demonstratedBundle, NOW);
    expect(demonstratedMastery.filter((row) => row.state === 'demonstrated').length).toBeGreaterThanOrEqual(2);
    expect(
      overallPracticeStage({
        competency: demonstratedMastery,
        evidence: demonstratedBundle,
        experience: 'advanced',
      }),
    ).toMatch(/deliberate|integration|maintenance/);

    const later = scoreAllCompetencyMastery(demonstratedBundle, NOW + 40 * DAY);
    expect(later.some((row) => row.state === 'due_for_redemonstration')).toBe(true);
    expect(
      overallPracticeStage({
        competency: later,
        evidence: demonstratedBundle,
        experience: 'advanced',
      }),
    ).toBe('maintenance');
  });
});

describe('reduced hints', () => {
  it('names the skill and offers hints in foundation, then conceals in deliberate practice', () => {
    const foundation = scaffoldingFor({ stage: 'foundation', experience: 'beginner' });
    expect(foundation.nameConcept).toBe(true);
    expect(foundation.showHints).toBe(true);
    expect(foundation.guidedQuestions).toBe(true);
    expect(foundation.concealConcept).toBe(false);

    const application = scaffoldingFor({ stage: 'application', experience: 'beginner' });
    expect(application.nameConcept).toBe(true);
    expect(application.concealConcept).toBe(false);

    const deliberate = scaffoldingFor({ stage: 'deliberate', experience: 'advanced' });
    expect(deliberate.nameConcept).toBe(false);
    expect(deliberate.showHints).toBe(false);
    expect(deliberate.concealConcept).toBe(true);
    expect(deliberate.incompleteInformation).toBe(true);
    expect(deliberate.competingExplanations).toBe(true);

    const policy = practiceStagePolicy('deliberate');
    expect(policy.complexity).toBe('complex');
    expect(policy.interleaveRelated).toBe(true);
    expect(policy.concealByDefault).toBe(true);
    expect(practiceStagePolicy('foundation').complexity).toBe('foundations');
    expect(practiceStagePolicy('application').minTransferStep).toBe('new_example');
    expect(practiceStagePolicy('maintenance').preferredLoop).toBe('redemonstrate');

    const plan = composeTodaysTraining(emptySnapshot({ experience: 'beginner' }));
    expect(plan.stage).toBe('foundation');
    expect(plan.items[0]?.title.toLowerCase()).not.toMatch(/assess this situation/);
  });
});

describe('interleaving', () => {
  it('avoids a long block of one family', () => {
    const items = [
      { conceptId: 'position-sizing' },
      { conceptId: 'risk-per-trade' },
      { conceptId: 'fomo' },
      { conceptId: 'event-risk' },
      { conceptId: 'chart-interpretation' },
      { conceptId: 'invalidation' },
    ];
    const interleaved = interleaveByFamily(items);
    expect(interleaved[0]?.conceptId).toBe('position-sizing');
    expect(consecutiveSameFamilyCount(interleaved)).toBeLessThanOrEqual(2);
    expect(interleaved.map((item) => item.conceptId)).toEqual(
      expect.arrayContaining(['fomo', 'event-risk', 'chart-interpretation', 'invalidation']),
    );
  });

  it('mixes related neighbors instead of a long RSI block when the learner is ready', () => {
    const items = [
      { conceptId: 'rsi' },
      { conceptId: 'momentum' },
      { conceptId: 'volume' },
      { conceptId: 'invalidation' },
      { conceptId: 'position-sizing' },
      { conceptId: 'fomo' },
    ];
    const mixed = interleaveByFamily(items, { mixRelated: true });
    expect(mixed[0]?.conceptId).toBe('rsi');
    expect(consecutiveSameFamilyCount(mixed)).toBeLessThanOrEqual(2);
    expect(mixed.map((item) => item.conceptId).slice(0, 3)).toEqual(
      expect.arrayContaining(['rsi', 'momentum']),
    );
  });
});

describe('transfer', () => {
  it('asks for position sizing in a context that has not just been practiced', () => {
    const records = [
      independentApp('position-sizing', 'high_volatility', NOW - DAY, 'vol'),
      independentApp('position-sizing', 'trend', NOW, 'trend'),
    ];
    const next = selectTransferContext('position-sizing', records);
    expect(next).not.toBe('trend');
    expect(['low_volatility', 'event_window', 'losing_position', 'concentrated_portfolio', 'ambiguous_setup']).toContain(
      next,
    );
  });
});

describe('spaced re-demonstration and long-term evidence', () => {
  it('scores variety and does not let old success freeze mastery', () => {
    const records = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        occurredAt: NOW - 5 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'calculation_exercise',
        sourceId: 'c',
        occurredAt: NOW - 4 * DAY,
        result: 'pass',
      }),
      independentApp('position-sizing', 'trend', NOW - 3 * DAY, 't'),
      independentApp('position-sizing', 'high_volatility', NOW - DAY, 'v'),
    ];
    const quality = scoreEvidenceQuality(records, NOW);
    expect(quality.variety).toBeGreaterThan(0);
    expect(quality.recency).toBeGreaterThan(0);
    expect(quality.consistency).toBeGreaterThan(0);

    const fresh = scoreCompetencyMastery('position-sizing', records, NOW);
    expect(fresh.state).toBe('demonstrated');
    expect(conceptPracticeStage(fresh)).toMatch(/deliberate|maintenance/);

    const stale = scoreCompetencyMastery('position-sizing', records, NOW + 40 * DAY);
    expect(stale.state).toBe('due_for_redemonstration');
    expect(conceptPracticeStage(stale)).toBe('maintenance');
    expect(stale.previouslyDemonstrated).toBe(true);
  });
});

describe('easy-session grinding', () => {
  it('does not treat hundreds of easy lessons as spaced mastery', () => {
    const lessons = Array.from({ length: 12 }, (_, index) =>
      ev({
        conceptId: 'chart-interpretation',
        sourceType: 'lesson_completion',
        sourceId: `lesson-${index}`,
        occurredAt: NOW - index * 3600_000,
        result: 'observed',
        difficulty: 'foundations',
      }),
    );
    const grinding = detectEasySessionGrinding(lessons, NOW);
    expect(grinding.grinding).toBe(true);
    expect(grinding.independentApplications).toBe(0);

    const plan = composeTodaysTraining(
      emptySnapshot({ experience: 'intermediate' }),
      {},
      { evidence: lessons, competency: scoreAllCompetencyMastery(lessons, NOW) },
    );
    expect(plan.items[0]?.priority).not.toBeUndefined();
    expect(`${plan.items[0]?.whyToday} ${plan.items[0]?.title}`.toLowerCase()).not.toMatch(
      /you mastered|ready to trade|good at trading/,
    );
    expect(plan.stage).toMatch(/foundation|application/);
  });

  it('treats a pile of multiple-choice answers as grinding, not mastery', () => {
    const quizzes = Array.from({ length: 12 }, (_, index) =>
      ev({
        conceptId: 'rsi',
        sourceType: 'knowledge_check',
        sourceId: `q-${index}`,
        occurredAt: NOW - index * 3600_000,
        result: 'pass',
        difficulty: 'applied',
      }),
    );
    const grinding = detectEasySessionGrinding(quizzes, NOW);
    expect(grinding.grinding).toBe(true);
    expect(grinding.questionSessions).toBeGreaterThanOrEqual(10);
    expect(grinding.independentApplications).toBe(0);
  });
});
