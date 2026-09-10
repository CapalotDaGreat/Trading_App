import { nextSpacedDueAt, scoreConceptMastery, isSpacedReviewDue } from '../concept-mastery.service';
import { targetComplexityFor } from '../adaptive-difficulty.service';
import { detectFocusAreas } from '../focus-area.service';
import { buildLearningEvidence, type ConceptEvidenceSlice } from '../learning-evidence.service';
import { walkConceptChain } from '../learning-graph.service';
import { nextAfterLesson } from '../lesson-next.service';
import { composeTodaysTraining } from '../practice-queue.service';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-10T12:00:00.000Z');

function slice(partial: Partial<ConceptEvidenceSlice> & { conceptId: string }): ConceptEvidenceSlice {
  return {
    quizAttempts: 0,
    quizMisses: 0,
    drillAttempts: 0,
    drillMisses: 0,
    drillCorrectRecent: 0,
    drillRecentTotal: 0,
    replayCompletions: 0,
    replayBest: null,
    lessonRead: false,
    lastPracticedAt: null,
    lastSuccessAt: null,
    successCount: 0,
    ...partial,
  };
}

describe('learning graph', () => {
  it('walks RSI through momentum, chart interpretation, divergence, and false signals', () => {
    expect(walkConceptChain('rsi')).toEqual([
      'RSI',
      'Momentum',
      'Chart interpretation',
      'Divergence',
      'False signals',
    ]);
  });
});

describe('concept mastery', () => {
  it('does not treat a read lesson as demonstrated skill', () => {
    const mastery = scoreConceptMastery(slice({ conceptId: 'support', lessonRead: true }), NOW);
    expect(mastery.state).toBe('exposed');
    expect(mastery.score).toBeNull();
    expect(mastery.evidence.join(' ')).toMatch(/exposure/i);
  });

  it('marks developing when exercises are failed after the lesson', () => {
    const mastery = scoreConceptMastery(
      slice({
        conceptId: 'support',
        lessonRead: true,
        drillAttempts: 4,
        drillMisses: 3,
        quizAttempts: 0,
      }),
      NOW,
    );
    expect(mastery.state).toBe('developing');
    expect(mastery.score).not.toBeNull();
  });
});

describe('spaced practice', () => {
  it('schedules day 1, 3, 7, then 14 after successful demonstrations', () => {
    const t0 = NOW;
    expect(nextSpacedDueAt(t0, 1) - t0).toBe(1 * DAY);
    expect(nextSpacedDueAt(t0, 2) - t0).toBe(3 * DAY);
    expect(nextSpacedDueAt(t0, 3) - t0).toBe(7 * DAY);
    expect(nextSpacedDueAt(t0, 4) - t0).toBe(14 * DAY);
    const due = scoreConceptMastery(
      slice({
        conceptId: 'position-sizing',
        drillAttempts: 1,
        lastSuccessAt: t0 - 3 * DAY,
        lastPracticedAt: t0 - 3 * DAY,
        successCount: 2,
      }),
      t0,
    );
    expect(isSpacedReviewDue(due, t0)).toBe(true);
  });
});

describe('after every lesson', () => {
  it('chains support lesson to identify support, false breakout, replay, then simulation', () => {
    const chain = nextAfterLesson('ta-structure');
    expect(chain?.steps.map((step) => step.title)).toEqual(
      expect.arrayContaining([
        'Find the strongest support',
        'Is this breakout confirmed?',
        'Replay a historical breakout',
        'Apply the concept in Simulation',
      ]),
    );
    expect(chain?.steps[0]?.href).toContain('find-support');
    expect(chain?.reminder.toLowerCase()).not.toMatch(/buy|sell|you are bad/);
  });
});

describe('adaptive difficulty', () => {
  it('raises conceptual complexity after consistent success and lowers it after struggle', () => {
    expect(
      targetComplexityFor(slice({ conceptId: 'support', drillRecentTotal: 5, drillCorrectRecent: 5 })),
    ).toBe('complex');
    expect(
      targetComplexityFor(slice({ conceptId: 'support', drillRecentTotal: 4, drillCorrectRecent: 1 })),
    ).toBe('foundations');
  });
});

describe('focus areas and queue', () => {
  it('uses non-negative labels and explains journal sizing evidence', () => {
    const snapshot = buildLearningEvidence({
      now: NOW,
      lessonProgress: {},
      conceptResults: {},
      attempts: [],
      journal: [
        { mistakeCategory: 'size', emotion: 'confident', createdAt: '2026-09-08T00:00:00.000Z' },
        { mistakeCategory: 'size', emotion: 'confident', createdAt: '2026-09-09T00:00:00.000Z' },
      ],
      replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
      experience: 'beginner',
    });
    const areas = detectFocusAreas(snapshot);
    expect(areas.some((area) => /position sizing/i.test(area.explanation))).toBe(true);
    expect(areas.join(' ').toLowerCase()).not.toMatch(/you are bad|bad at trading/);
    expect(areas[0]?.title).toMatch(/Area to improve|Developing skill|Practice opportunity/);
  });

  it('builds a personalized queue a user can skip, and hides skipped items', () => {
    const snapshot = buildLearningEvidence({
      now: NOW,
      lessonProgress: {
        'ta-structure': {
          completed: true,
          read: true,
          practiced: false,
          quizAttempts: 0,
          exerciseAttempts: 0,
          lastOpenedAt: '2026-09-10T10:00:00.000Z',
        },
      },
      conceptResults: { support: { attempts: 4, misses: 3, lastAt: '2026-09-10T11:00:00.000Z' } },
      attempts: [
        { drillId: 'find-support', at: '2026-09-10T11:00:00.000Z', correct: false, selectedIndex: 0 },
        { drillId: 'find-support', at: '2026-09-10T11:05:00.000Z', correct: false, selectedIndex: 0 },
      ],
      journal: [],
      replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
      nextLessonId: 'ta-structure',
      experience: 'beginner',
      hasSimulation: false,
    });
    const open = composeTodaysTraining(snapshot);
    expect(open.items.some((item) => item.kind === 'continue_lesson')).toBe(true);
    expect(open.items.some((item) => item.kind === 'journal_review')).toBe(true);
    expect(open.items.some((item) => item.kind === 'simulation_challenge')).toBe(true);
    expect(open.items.some((item) => item.kind === 'event_prep')).toBe(false);
    const lead = open.items[0]!;
    const skipped = composeTodaysTraining(snapshot, { [lead.id]: { skippedUntil: NOW + DAY } });
    expect(skipped.items[0]?.id).not.toBe(lead.id);
    expect(`${open.coachLine} ${open.headline}`.toLowerCase()).not.toMatch(/you are bad|buy this|sell this/);
  });

  it('adds event prep only when the user can handle it', () => {
    const eventPlan = {
      headline: 'Sample earnings week in 3 days.',
      eventTitle: 'Sample earnings week',
      daysUntil: 3,
      lessonTitle: 'Reading statements',
      lessonHref: '/academy/lesson/fund-statements',
      practiceTitle: 'Practice',
      practiceHref: '/practice',
      replayTitle: 'Replay',
      replayHref: '/decision/replay-tv?episode=nvidia-earnings',
      simulateTitle: 'Sim',
      simulateHref: '/simulate?prep=earnings',
      reminder: 'Study stack, not a prediction.',
    };
    const beginner = composeTodaysTraining(
      buildLearningEvidence({
        now: NOW,
        lessonProgress: {},
        conceptResults: {},
        attempts: [],
        journal: [],
        replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
        experience: 'beginner',
        eventPlan,
      }),
    );
    expect(beginner.items.some((item) => item.kind === 'event_prep')).toBe(false);

    const advanced = composeTodaysTraining(
      buildLearningEvidence({
        now: NOW,
        lessonProgress: {},
        conceptResults: {},
        attempts: [],
        journal: [],
        replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
        experience: 'advanced',
        eventPlan,
      }),
    );
    expect(advanced.items.some((item) => item.kind === 'event_prep')).toBe(true);
  });
});
