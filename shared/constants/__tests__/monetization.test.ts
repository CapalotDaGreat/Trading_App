import {
  AI_DAILY_LIMIT_FREE,
  AI_DAILY_LIMIT_PREMIUM,
  LAUNCH_FEATURE_COMPARISON,
  LAUNCH_PLAN_IDS,
  LIFETIME_OFFERED_AT_LAUNCH,
  YEARLY_TRIAL_DAYS,
  isLaunchPlanId,
} from '../monetization';

describe('launch monetization catalog', () => {
  it('offers monthly and yearly only, with a yearly trial and no lifetime', () => {
    expect(LAUNCH_PLAN_IDS).toEqual(['monthly', 'yearly']);
    expect(isLaunchPlanId('monthly')).toBe(true);
    expect(isLaunchPlanId('yearly')).toBe(true);
    expect(isLaunchPlanId('lifetime')).toBe(false);
    expect(LIFETIME_OFFERED_AT_LAUNCH).toBe(false);
    expect(YEARLY_TRIAL_DAYS).toBe(7);
  });

  it('keeps free useful and sells Premium as depth with daily AI fair use', () => {
    expect(AI_DAILY_LIMIT_FREE).toBe(3);
    expect(AI_DAILY_LIMIT_PREMIUM).toBe(100);
    const byFeature = Object.fromEntries(
      LAUNCH_FEATURE_COMPARISON.map((row) => [row.feature, row]),
    );
    expect(byFeature.Today).toEqual({ feature: 'Today', free: 'Included', premium: 'Included' });
    expect(byFeature['Basic journal']?.free).toBe('Included');
    expect(byFeature.AI?.free).toBe('3/day');
    expect(byFeature.AI?.premium).toContain('fair use');
    expect(byFeature['Portfolio intelligence']?.free).toBe('—');
    expect(byFeature.Export?.premium).toBe('Included');
    expect(byFeature.Ads?.free).toBe('None at launch');
    expect(byFeature['7-day trial']?.premium).toBe('Yearly only');
  });
});
