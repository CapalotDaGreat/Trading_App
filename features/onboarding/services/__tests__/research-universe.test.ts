import { recommendResearchUniverse } from '../research-universe.catalog';
import { deriveCoachProfile } from '../coach-profile.service';
import { EMPTY_COACH_ANSWERS } from '../../types/mentor-setup.types';

describe('research universe recommendations', () => {
  it('prefers liquid majors for beginners interested in stocks', () => {
    const symbols = recommendResearchUniverse({
      markets: ['stocks', 'etfs'],
      experience: 'beginner',
      styles: ['swing'],
    });
    expect(symbols.length).toBeGreaterThanOrEqual(5);
    expect(symbols.length).toBeLessThanOrEqual(7);
    expect(symbols).toEqual(expect.arrayContaining(['SPY']));
  });

  it('includes forex pairs when forex is selected', () => {
    const symbols = recommendResearchUniverse({
      markets: ['forex'],
      experience: 'intermediate',
      styles: ['day_trading'],
    });
    expect(symbols.some((s) => s.includes('/'))).toBe(true);
  });
});

describe('deriveCoachProfile', () => {
  it('builds a readable learning profile label', () => {
    const derived = deriveCoachProfile({
      ...EMPTY_COACH_ANSWERS,
      experience: 'intermediate',
      markets: ['stocks', 'etfs'],
      styles: ['swing'],
      struggles: ['risk_management'],
      timeBudgetMinutes: 20,
    });
    expect(derived.learningProfileLabel).toMatch(/Intermediate/);
    expect(derived.focusStruggleLabel).toBe('Risk management');
    expect(derived.timeBudgetLabel).toBe('20 min/day');
  });
});
