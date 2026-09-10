import { createEvidenceRecord, scoreAllCompetencyMastery } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';
import { DEMO_USER_UID } from '@/firebase/config';
import { activityKey } from '@/features/learning-engine/services/concept-handoff.service';
import { buildLearningEvidence } from '@/features/learning-engine/services/learning-evidence.service';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { composeLearnerModel } from '@/features/learner-model';

import { looksLikeTradeSignal } from '../planner-scoring.service';
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

function sizingPath(uid: string, at = NOW): CompetencyEvidenceRecord[] {
  return [
    ev(uid, {
      conceptId: 'position-sizing',
      sourceType: 'knowledge_check',
      sourceId: 'quiz',
      occurredAt: at - 5 * DAY,
      result: 'pass',
    }),
    ev(uid, {
      conceptId: 'position-sizing',
      sourceType: 'calculation_exercise',
      sourceId: 'calc',
      occurredAt: at - 4 * DAY,
      result: 'pass',
    }),
    ev(uid, {
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'sim-trend',
      occurredAt: at - 3 * DAY,
      difficulty: 'complex',
      scenarioContext: 'trend',
      processMetrics: { processQuality: 82, simulatedProfitable: false, simulatedPnl: -30 },
    }),
    ev(uid, {
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

function planFor(
  uid: string,
  evidence: CompetencyEvidenceRecord[],
    extra: {
    dispositions?: Parameters<typeof composeTrainingPlan>[0]['dispositions'];
    snapshot?: ReturnType<typeof snapshot>;
    recent?: string[];
    sessionLength?: 'quick' | 'normal' | 'deep';
    now?: number;
    learnerModel?: Parameters<typeof composeTrainingPlan>[0]['learnerModel'];
    conceptDeferCounts?: Record<string, number>;
  } = {},
) {
  const now = extra.now ?? NOW;
  const snap = extra.snapshot ?? snapshot({ now, experience: 'intermediate' });
  return composeTrainingPlan({
    uid,
    snapshot: snap,
    dispositions: extra.dispositions,
    sessionLength: extra.sessionLength,
    learnerModel: extra.learnerModel,
    options: {
      evidence,
      competency: scoreAllCompetencyMastery(evidence, now),
      recentActivityKeys: extra.recent,
      conceptDeferCounts: extra.conceptDeferCounts,
    },
  });
}

function blob(plan: ReturnType<typeof composeTrainingPlan>): string {
  return `${plan.headline} ${plan.whyPrimary} ${plan.queue.map((item) => `${item.title} ${item.reason}`).join(' ')}`.toLowerCase();
}

describe('training planner', () => {
  it('ranks remediation ahead of new curriculum', () => {
    const rem = [
      ...sizingPath('user-a'),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1000,
        result: 'fail',
      }),
    ];
    const plan = planFor('user-a', rem, {
      snapshot: snapshot({ now: NOW + 1000, experience: 'beginner', nextLessonId: 'ta-candles' }),
      now: NOW + 1000,
    });
    expect(plan.primary?.isRemediation).toBe(true);
    expect(plan.primary?.conceptId).toBe('position-sizing');
    expect(plan.primary?.priority).toBe('remediation');
    expect(plan.queue.some((item) => item.priority === 'curriculum')).toBe(true);
  });

  it('surfaces overdue re-demonstration', () => {
    const later = NOW + 40 * DAY;
    const plan = planFor('user-a', sizingPath('user-a'), {
      snapshot: snapshot({ now: later, experience: 'intermediate' }),
      now: later,
    });
    expect(plan.primary?.isRedemonstration).toBe(true);
    expect(plan.primary?.reason).toMatch(/days|re-demonstration|retrieval/i);
  });

  it('can recommend a weak competency', () => {
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
        occurredAt: NOW,
        result: 'fail',
      }),
    ];
    const plan = planFor('user-a', evidence);
    expect(plan.primary?.priority).toBe('weak_competency');
    expect(plan.primary?.conceptId).toBe('invalidation');
  });

  it('deprioritizes a recently completed activity', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'support',
        sourceType: 'lesson_completion',
        sourceId: 'ta-structure',
        result: 'observed',
      }),
    ];
    const first = planFor('user-a', evidence, { snapshot: snapshot({ experience: 'beginner' }) });
    const leadHref = first.primary?.href ?? '';
    const second = planFor('user-a', evidence, {
      snapshot: snapshot({ experience: 'beginner' }),
      recent: [activityKey(leadHref)],
    });
    expect(activityKey(second.primary!.href)).not.toBe(activityKey(leadHref));
    expect(second.primary?.conceptId).toBe(first.primary?.conceptId);
  });

  it('turns repeated failures into remediation, not a lockout', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'event-risk',
        sourceType: 'knowledge_check',
        sourceId: 'eq',
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'event-risk',
        sourceType: 'simulation_decision',
        sourceId: 'a',
        result: 'fail',
        processMetrics: { processQuality: 20 },
      }),
      ev('user-a', {
        conceptId: 'event-risk',
        sourceType: 'simulation_decision',
        sourceId: 'b',
        occurredAt: NOW + 1000,
        result: 'fail',
        processMetrics: { processQuality: 18 },
      }),
    ];
    const plan = planFor('user-a', evidence, { now: NOW + 1000 });
    expect(plan.primary?.isRemediation || plan.primary?.reason).toBeTruthy();
    expect(plan.primary?.reason).toMatch(/struggled|isolates|process/i);
    expect(plan.primary?.reason).not.toMatch(/locked out|you are bad/i);
  });

  it('reduces transfer priority after successful new-context demonstrations', () => {
    const before = [
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'knowledge_check',
        sourceId: 'q',
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'practice_drill',
        sourceId: 'd',
        result: 'pass',
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 's1',
        result: 'pass',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const after = [
      ...before,
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 's2',
        occurredAt: NOW + 2000,
        result: 'pass',
        scenarioContext: 'range',
        processMetrics: { processQuality: 82 },
      }),
    ];
    const first = planFor('user-a', before);
    const second = planFor('user-a', after, { now: NOW + 2000 });
    const firstTransfer = first.queue.find((item) => item.isTransferPractice && item.conceptId === 'thesis');
    const secondTransfer = second.queue.find((item) => item.isTransferPractice && item.conceptId === 'thesis');
    if (firstTransfer && secondTransfer) {
      expect(secondTransfer.score).toBeLessThan(firstTransfer.score);
    } else {
      expect(second.primary?.id.startsWith('transfer-thesis')).toBe(false);
    }
  });

  it('defers without counting as failure and hides the item until later', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'lesson_completion',
        sourceId: 'dec-invalidation',
        result: 'observed',
      }),
    ];
    const first = planFor('user-a', evidence, { snapshot: snapshot({ experience: 'beginner' }) });
    const id = first.primary!.id;
    const deferred = planFor('user-a', evidence, {
      snapshot: snapshot({ experience: 'beginner' }),
      dispositions: {
        [id]: {
          deferredUntil: NOW + DAY,
          deferCount: 1,
          lastDeferReason: 'Need a shorter session',
          lastDeferredAt: NOW,
        },
      },
    });
    expect(deferred.queue.some((item) => item.id === id)).toBe(false);
    expect(deferred.primary?.id).not.toBe(id);
  });

  it('records deferral reason on the queue store without treating it as a miss', () => {
    useLearningQueueStore.getState().reset();
    useLearningQueueStore.getState().defer('progress-invalidation', NOW, 'invalidation', 'Need a shorter session');
    const row = useLearningQueueStore.getState().dispositions['progress-invalidation'];
    expect(row.lastDeferReason).toBe('Need a shorter session');
    expect(row.deferredUntil).toBe(NOW + DAY);
    expect(row.skipCount).toBeUndefined();
    useLearningQueueStore.getState().reset();
  });

  it('is deterministic for identical learner state', () => {
    const evidence = sizingPath('user-a');
    const a = planFor('user-a', evidence);
    const b = planFor('user-a', evidence);
    expect(a.queue.map((item) => `${item.id}:${item.score}`)).toEqual(
      b.queue.map((item) => `${item.id}:${item.score}`),
    );
    expect(a.primary?.id).toBe(b.primary?.id);
  });

  it('works for guest users', () => {
    const plan = composeTrainingPlan({
      uid: DEMO_USER_UID,
      snapshot: snapshot({ experience: 'beginner' }),
    });
    expect(plan.uid).toBe(DEMO_USER_UID);
    expect(plan.primary?.href).toContain('path-foundations');
    expect(plan.primary?.priority).toBe('curriculum');
  });

  it('scopes recommendations to the supplied user evidence', () => {
    const alice = planFor('alice', sizingPath('alice'));
    const bob = planFor(
      'bob',
      [
        ev('bob', {
          conceptId: 'fomo',
          sourceType: 'practice_drill',
          sourceId: 'f1',
          result: 'fail',
        }),
        ev('bob', {
          conceptId: 'fomo',
          sourceType: 'practice_drill',
          sourceId: 'f2',
          occurredAt: NOW + 1,
          result: 'fail',
        }),
      ],
      { now: NOW + 1 },
    );
    expect(alice.uid).toBe('alice');
    expect(bob.uid).toBe('bob');
    expect(alice.primary?.conceptId).not.toBe(bob.primary?.conceptId);
  });

  it('does not require raw journal prose', () => {
    const plan = composeTrainingPlan({
      uid: 'user-a',
      snapshot: snapshot({
        experience: 'intermediate',
        journal: [{ mistakeCategory: 'fomo', emotion: 'anxious', createdAt: new Date(NOW).toISOString() }],
      }),
    });
    expect(JSON.stringify(plan.today)).not.toMatch(/dear diary|long narrative/i);
    expect(plan.today.items.join('')).not.toMatch(/notes:/i);
  });

  it('never produces buy/sell recommendations', () => {
    const plan = planFor('user-a', sizingPath('user-a'));
    for (const item of plan.queue) {
      expect(looksLikeTradeSignal(`${item.title} ${item.reason} ${item.href}`)).toBe(false);
      expect(item.reason.toLowerCase()).not.toMatch(/buy this|sell this|go long|go short/);
    }
  });

  it('explains missing application after quizzes', () => {
    const evidence = [
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'quiz',
        result: 'pass',
      }),
    ];
    const plan = planFor('user-a', evidence);
    expect(plan.primary?.conceptId).toBe('position-sizing');
    expect(plan.primary?.reason).toMatch(/quizzes|simulation|demonstrated/i);
  });

  it('uses observational mistake-library copy for matching remediation', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        result: 'fail',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        result: 'fail',
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const learner = composeLearnerModel({ uid: 'user-a', records, now: NOW + 1 });
    const plan = planFor('user-a', records, { now: NOW + 1, learnerModel: learner });
    expect(plan.primary?.conceptId).toBe('fomo');
    expect(plan.primary?.reason).toMatch(/shortly after missing a move/i);
    expect(plan.primary?.reason.toLowerCase()).not.toMatch(/you are an emotional trader|diagnos/);
    const without = planFor('user-a', records, { now: NOW + 1 });
    expect(plan.primary!.score).toBeGreaterThan(without.primary!.score);
  });

  it('lets session length change the selected activity', () => {
    const evidence = sizingPath('user-a');
    const quick = planFor('user-a', evidence, { sessionLength: 'quick' });
    const deep = planFor('user-a', evidence, { sessionLength: 'deep' });
    expect(quick.sessionLength).toBe('quick');
    expect(deep.sessionLength).toBe('deep');
    expect(quick.sessionBudgetMinutes).toBe(10);
    expect(deep.sessionBudgetMinutes).toBe(45);
    expect(quick.primary && deep.primary).toBeTruthy();
    const sameItem =
      quick.primary?.id === deep.primary?.id &&
      quick.primary?.estimatedMinutes === deep.primary?.estimatedMinutes &&
      quick.primary?.activityType === deep.primary?.activityType;
    expect(sameItem).toBe(false);
    expect(quick.primary!.estimatedMinutes).toBeLessThanOrEqual(deep.primary!.estimatedMinutes);
  });

  it('surfaces a shorter alternative after a deferral on the same gap', () => {
    const rem = [
      ...sizingPath('user-a'),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
      }),
      ev('user-a', {
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1000,
        result: 'fail',
      }),
    ];
    const base = planFor('user-a', rem, { now: NOW + 1000 });
    expect(base.primary?.id).toBeTruthy();
    const deferred = planFor('user-a', rem, {
      now: NOW + 1000,
      dispositions: {
        [base.primary!.id]: { deferredUntil: NOW + 2 * DAY, deferCount: 1, lastDeferredAt: NOW + 1000 },
      },
      conceptDeferCounts: base.primary?.conceptId ? { [base.primary.conceptId]: 1 } : {},
    });
    expect(deferred.primary?.id).not.toBe(base.primary?.id);
    if (deferred.primary?.conceptId && deferred.primary.conceptId === base.primary?.conceptId) {
      expect(deferred.whyPrimary).toMatch(/deferred|shorter/i);
    }
  });
});
