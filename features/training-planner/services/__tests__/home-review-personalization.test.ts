import { createEvidenceRecord, scoreAllCompetencyMastery } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';
import { buildLearningEvidence } from '@/features/learning-engine/services/learning-evidence.service';
import { composeLearnerModel, emptyLearnerModel } from '@/features/learner-model';

import { composeHomePersonalization, homeCopyLooksLikeTrophy, homePrimaryMatchesPlanner } from '../home-personalization.service';
import { composeReviewBrief, reviewCopyLooksLikePnlGrade } from '../review-brief.service';
import { composeTrainingPlan } from '../training-planner.service';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-10T12:00:00.000Z');

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

function snapshot(extra: Partial<Parameters<typeof buildLearningEvidence>[0]> = {}) {
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

function planFor(
  uid: string,
  evidence: CompetencyEvidenceRecord[],
  extra: {
    snapshot?: ReturnType<typeof snapshot>;
    now?: number;
    learnerModel?: ReturnType<typeof composeLearnerModel>;
  } = {},
) {
  const now = extra.now ?? NOW;
  const snap = extra.snapshot ?? snapshot({ now, experience: 'intermediate' });
  const competency = scoreAllCompetencyMastery(evidence, now);
  const learner =
    extra.learnerModel ??
    composeLearnerModel({
      uid,
      records: evidence,
      now,
      mastery: competency,
    });
  const plan = composeTrainingPlan({
    uid,
    snapshot: snap,
    learnerModel: learner,
    options: { evidence, competency },
  });
  return { plan, learner, snapshot: snap };
}

const EMPTY_JOURNAL = {
  count: 0,
  withUsableNotes: 0,
  withReflection: 0,
  withProcessTag: 0,
};

describe('Home and Review personalization', () => {
  it('uses the Unified Training Planner primary as Home’s CTA', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q1',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        result: 'fail',
      }),
    ];
    const { plan, learner, snapshot: snap } = planFor('user-a', evidence);
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    expect(home.primary?.id).toBe(plan.primary?.id);
    expect(home.todayTitle).toBe(plan.primary?.title);
    expect(home.whyThis).toBe(plan.whyPrimary);
    expect(homePrimaryMatchesPlanner(home, plan.primary)).toBe(true);
    expect(homeCopyLooksLikeTrophy(home)).toBe(false);
  });

  it('empty beginner state starts Foundations and does not invent improvements', () => {
    const snap = snapshot({ experience: 'beginner' });
    const plan = composeTrainingPlan({ uid: 'user-a', snapshot: snap });
    const learner = emptyLearnerModel('user-a', NOW);
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    const brief = composeReviewBrief({
      plan,
      learner,
      activity: { journal: EMPTY_JOURNAL, replayCompletedCount: 0 },
    });

    expect(plan.emptyState).toBe('new_user');
    expect(home.emptyState).toBe('new_user');
    expect(home.beginner).toBe(true);
    expect(home.primary?.href).toContain('path-foundations');
    expect(home.improving).toEqual([]);
    expect(home.keepAnEyeOn).toBeNull();
    expect(home.continueWork).toBeNull();
    expect(home.emptyPersonalization).toBe(true);
    expect(brief.empty).toBe(true);
    expect(brief.headline).toBe('Your decisions will appear here');
    expect(brief.improvements).toEqual([]);
    expect(brief.nextTraining?.id).toBe(plan.primary?.id);
  });

  it('advanced state can show transfer watch without a trophy score', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        occurredAt: NOW - 5 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'd',
        occurredAt: NOW - 4 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        occurredAt: NOW - 3 * DAY,
        result: 'pass',
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 82, simulatedProfitable: true, simulatedPnl: 1200 },
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'knowledge_check',
        sourceId: 'tq',
        occurredAt: NOW - 2 * DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'practice_drill',
        sourceId: 'td',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'ts1',
        result: 'pass',
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const { plan, learner, snapshot: snap } = planFor('user-a', evidence, {
      snapshot: snapshot({ now: NOW, experience: 'advanced' }),
    });
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    expect(home.beginner).toBe(false);
    expect(home.primary?.priority).not.toBe('curriculum');
    expect(home.emptyPersonalization).toBe(false);
    expect(home.keepAnEyeOn || home.improving.length > 0).toBeTruthy();
    expect(JSON.stringify(home)).not.toMatch(/Trading Mastery/i);
    expect(homeCopyLooksLikeTrophy(home)).toBe(false);
  });

  it('surfaces unfinished lesson work as Continue when it is not the primary', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q1',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        result: 'fail',
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        result: 'fail',
      }),
    ];
    const { plan, learner, snapshot: snap } = planFor('user-a', evidence, {
      now: NOW + 1,
      snapshot: snapshot({
        now: NOW + 1,
        experience: 'intermediate',
        lessonProgress: {
          'ta-candles': {
            completed: false,
            read: false,
            practiced: false,
            quizAttempts: 0,
            exerciseAttempts: 0,
            lastOpenedAt: new Date(NOW - DAY).toISOString(),
          },
        },
      }),
    });
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    expect(home.primary?.conceptId).toBe('invalidation');
    expect(home.continueWork?.href).toContain('/academy/lesson/ta-candles');
    expect(home.continueWork?.href).not.toBe(home.primary?.href);
  });

  it('shows meaningful improvements from longitudinal evidence', () => {
    const uid = 'user-a';
    const evidence = [
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'early-1',
        occurredAt: NOW - 20 * DAY,
        result: 'fail',
      }),
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'early-2',
        occurredAt: NOW - 18 * DAY,
        result: 'fail',
      }),
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'late-1',
        occurredAt: NOW - 4 * DAY,
        result: 'pass',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 78 },
      }),
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'late-2',
        occurredAt: NOW - DAY,
        result: 'pass',
        scenarioContext: 'range',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const { plan, learner, snapshot: snap } = planFor(uid, evidence);
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    const slice = learner.longitudinal.concepts.find((row) => row.conceptId === 'invalidation');
    expect(slice?.improvement).toBe('improving');
    expect(home.improving.some((item) => /invalidation/i.test(item.title))).toBe(true);
  });

  it('does not let simulated P/L override a competency recommendation on Home or Review', () => {
    const uid = 'user-a';
    const evidence = [
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        occurredAt: NOW - 2 * DAY,
        result: 'pass',
      }),
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'miss-1',
        occurredAt: NOW - DAY,
        result: 'fail',
      }),
      ev(uid, {
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        result: 'fail',
      }),
      ev(uid, {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'lucky-sim',
        result: 'pass',
        difficulty: 'complex',
        scenarioContext: 'trend',
        processMetrics: {
          processQuality: 40,
          simulatedProfitable: true,
          simulatedPnl: 48_000,
        },
      }),
    ];
    const { plan, learner, snapshot: snap } = planFor(uid, evidence);
    const home = composeHomePersonalization({ plan, learner, snapshot: snap });
    const brief = composeReviewBrief({
      plan,
      learner,
      activity: {
        journal: { count: 1, withUsableNotes: 1, withReflection: 0, withProcessTag: 1 },
        simulation: {
          decisionCount: 3,
          thesisBackedCount: 1,
          closeReviewCount: 0,
          processGaps: ['Name what would prove the idea wrong before you add risk.'],
          processStrengths: [],
          equityLabel: '$148,000',
        },
        replayCompletedCount: 1,
      },
    });

    expect(plan.primary?.conceptId).toBe('invalidation');
    expect(home.primary?.id).toBe(plan.primary?.id);
    expect(home.primary?.conceptId).toBe('invalidation');
    expect(home.whyThis.toLowerCase()).not.toMatch(/made money|\$148|48000|paper profit/);
    expect(brief.nextTraining?.id).toBe(plan.primary?.id);
    expect(brief.nextTraining?.conceptId).toBe('invalidation');
    expect(brief.headline.toLowerCase()).not.toMatch(/made money|equity|p\/l|pnl/);
    expect(brief.simulationReflection).toMatch(/not the grade/i);
    expect(brief.simulationReflection).not.toMatch(/\$148,000/);
    expect(reviewCopyLooksLikePnlGrade(brief)).toBe(false);
  });

  it('Review empty state asks about process, not profit', () => {
    const snap = snapshot({ experience: 'beginner' });
    const plan = composeTrainingPlan({ uid: 'guest', snapshot: snap });
    const brief = composeReviewBrief({
      plan,
      learner: emptyLearnerModel('guest', NOW),
      activity: { journal: EMPTY_JOURNAL, replayCompletedCount: 0 },
    });
    expect(brief.empty).toBe(true);
    expect(brief.processInsight).toMatch(/record a decision/i);
    expect(brief.journalQualityNote).toMatch(/thesis|invalidation/i);
    expect(brief.simulationReflection).toBeNull();
    expect(brief.replayReflection).toBeNull();
    expect(reviewCopyLooksLikePnlGrade(brief)).toBe(false);
  });
});
