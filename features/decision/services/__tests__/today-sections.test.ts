import {
  reviewAccessLabel,
  selectTodayTimeBudget,
  TODAY_SECTION_ORDER,
  visibleTodaySections,
} from '../today-sections.service';

const populatedContext = {
  hasBrief: true,
  hasMentor: true,
  hasStartHere: true,
  hasResearchQueue: true,
  hasWhyNot: true,
  hasDecisionLog: true,
  hasRegime: true,
  hasGoals: true,
  hasDayPlan: true,
  hasDnaPulse: true,
  hasDynamicToday: true,
} as const;

describe('Today section configuration', () => {
  it('keeps personal intelligence sections in the default order', () => {
    expect(TODAY_SECTION_ORDER).toEqual([
      'header',
      'dynamicToday',
      'morningBrief',
      'mentor',
      'goals',
      'dayPlan',
      'dnaPulse',
      'startHere',
      'researchQueue',
      'whyNot',
      'decisionLog',
      'regime',
      'closeLoop',
    ]);
    expect(TODAY_SECTION_ORDER.length).toBeLessThanOrEqual(14);
  });

  it('only shows data-backed optional sections', () => {
    expect(
      visibleTodaySections({
        ...populatedContext,
        hasMentor: false,
        hasStartHere: false,
        hasWhyNot: false,
        hasDecisionLog: false,
        hasGoals: false,
        hasDayPlan: false,
        hasDnaPulse: false,
        tier: 'free',
      }),
    ).toEqual([
      'header',
      'dynamicToday',
      'morningBrief',
      'researchQueue',
      'regime',
      'closeLoop',
    ]);
  });

  it('applies personalized preferred order without dropping core loop', () => {
    const sections = visibleTodaySections({
      ...populatedContext,
      tier: 'premium',
      preferredOrder: [
        'header',
        'dynamicToday',
        'goals',
        'mentor',
        'closeLoop',
        'morningBrief',
        'startHere',
        'researchQueue',
      ],
    });
    expect(sections[0]).toBe('header');
    expect(sections).toContain('morningBrief');
    expect(sections).toContain('closeLoop');
    expect(sections.indexOf('goals')).toBeLessThan(sections.indexOf('morningBrief'));
  });

  it('keeps the core Today loop visible for free and premium users', () => {
    expect(visibleTodaySections({ ...populatedContext, tier: 'free' })).toEqual(
      visibleTodaySections({ ...populatedContext, tier: 'premium' }),
    );
    expect(reviewAccessLabel('premium')).toBe('Review your decision process');
    expect(reviewAccessLabel('free')).toContain('options');
  });

  it('selects the persisted research budget instead of a screen literal', () => {
    expect(selectTodayTimeBudget({ preferences: { timeBudgetMinutes: 45 } })).toBe(45);
  });
});
