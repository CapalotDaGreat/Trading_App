import {
  reviewAccessLabel,
  selectTodayTimeBudget,
  TODAY_SECTION_ORDER,
  visibleTodaySections,
} from '../today-sections.service';

const populatedContext = {
  hasBrief: true,
  hasStartHere: true,
  hasResearchQueue: true,
  hasWhyNot: true,
  hasDecisionLog: true,
  hasRegime: true,
} as const;

describe('Today section configuration', () => {
  it('keeps the requested eight-block order', () => {
    expect(TODAY_SECTION_ORDER).toEqual([
      'header',
      'morningBrief',
      'startHere',
      'researchQueue',
      'whyNot',
      'decisionLog',
      'regime',
      'closeLoop',
    ]);
    expect(TODAY_SECTION_ORDER.length).toBeLessThanOrEqual(10);
  });

  it('only shows data-backed optional sections', () => {
    expect(
      visibleTodaySections({
        ...populatedContext,
        hasStartHere: false,
        hasWhyNot: false,
        hasDecisionLog: false,
        tier: 'free',
      }),
    ).toEqual(['header', 'morningBrief', 'researchQueue', 'regime', 'closeLoop']);
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
