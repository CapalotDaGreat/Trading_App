import { ALL_LESSONS } from '@/features/academy/content';
import { buildSkillModel } from '../skill-model.service';
import { composeTrainingLoop } from '../training-loop.service';
import { assessTrainingReadiness } from '../readiness.service';
import { buildWeeklyTrainingPlan } from '../weekly-training-plan.service';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';

describe('skill model and training loop', () => {
  const drill = PRACTICE_DRILLS[0]!;

  it('stays empty until there is observed work', () => {
    const skill = buildSkillModel({ lessons: ALL_LESSONS, lessonProgress: {}, attempts: [] });
    expect(skill.weakest).toBeNull();
    expect(skill.domains.every((item) => item.evidence === 'none')).toBe(true);
  });

  it('maps a missed chart drill into chart reading weakness', () => {
    const skill = buildSkillModel({
      lessons: ALL_LESSONS,
      lessonProgress: {},
      attempts: [
        { drillId: 'identify-trend', correct: false, selectedIndex: 2, at: '2026-09-10T00:00:00.000Z' },
        { drillId: 'identify-trend', correct: false, selectedIndex: 2, at: '2026-09-10T00:01:00.000Z' },
      ],
    });
    expect(skill.weakest).toBe('chart_reading');
    expect(skill.domains.find((item) => item.domain === 'chart_reading')?.evidence).not.toBe('none');
  });

  it('builds a loop that always includes learn, practice, replay, simulate, review', () => {
    const plan = composeTrainingLoop({
      nextLesson: null,
      drill,
      weakness: 'chart_reading',
      hasSimulation: false,
      hasJournal: false,
      hasReplayProgress: false,
      upcomingEventTitle: 'FOMC decision',
    });
    expect(plan.chain.map((item) => item.kind)).toEqual([
      'learn',
      'practice',
      'replay',
      'simulate',
      'review',
      'events',
    ]);
    expect(plan.weaknessLabel).toBe('Chart Reading');
    expect(plan.processReminder.toLowerCase()).toContain('profit');
  });

  it('never certifies live trading', () => {
    const skill = buildSkillModel({ lessons: ALL_LESSONS, lessonProgress: {}, attempts: [] });
    const readiness = assessTrainingReadiness({
      skill,
      lessonsRead: 2,
      practiced: 1,
      journalCount: 1,
      thesisDecisions: 1,
      closeReviews: 0,
      practiceAccuracy: 0.5,
    });
    expect(readiness.certifiesLiveTrading).toBe(false);
    expect(readiness.disclaimer.toLowerCase()).toContain('not permission');
    expect(readiness.headline.toLowerCase()).not.toContain('ready to trade real money');
    expect(readiness.headline.toLowerCase()).not.toContain('weakness');
  });

  it('does not treat many paper fills without reviews as strong simulation behavior', () => {
    const skill = buildSkillModel({ lessons: ALL_LESSONS, lessonProgress: {}, attempts: [] });
    const readiness = assessTrainingReadiness({
      skill,
      lessonsRead: 0,
      practiced: 0,
      journalCount: 0,
      thesisDecisions: 6,
      closeReviews: 0,
      practiceAccuracy: 0,
    });
    const sim = readiness.dimensions.find((item) => item.id === 'simulation_behavior');
    expect(sim?.score).toBeLessThan(40);
    expect(sim?.note.toLowerCase()).toMatch(/insufficient|close review/);
  });

  it('builds a five-step weekly plan', () => {
    const skill = buildSkillModel({
      lessons: ALL_LESSONS,
      lessonProgress: {},
      attempts: [{ drillId: 'identify-trend', correct: false, selectedIndex: 0, at: 't' }],
    });
    const weekly = buildWeeklyTrainingPlan({ skill, nextLesson: null, drill });
    expect(weekly.items).toHaveLength(5);
    expect(weekly.items.map((item) => item.kind)).toEqual([
      'learn',
      'practice',
      'replay',
      'simulate',
      'review',
    ]);
  });
});
