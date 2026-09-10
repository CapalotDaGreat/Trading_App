import { ANALYTICS_EVENTS, ANALYTICS_PROP_KEYS } from '../events';

describe('analytics allowlist', () => {
  it('never includes sensitive event names', () => {
    const joined = ANALYTICS_EVENTS.join(',');
    expect(joined).not.toMatch(/journal|password|portfolio_value|ai_message|prompt/i);
    expect(joined).not.toMatch(/dna_|trading_dna|trait_score|personality/i);
  });

  it('never allows free-text prop keys', () => {
    expect(ANALYTICS_PROP_KEYS).not.toContain('notes');
    expect(ANALYTICS_PROP_KEYS).not.toContain('prompt');
    expect(ANALYTICS_PROP_KEYS).not.toContain('email');
    expect(ANALYTICS_PROP_KEYS).not.toContain('reasoning');
    expect(ANALYTICS_PROP_KEYS).not.toContain('journal');
    expect(ANALYTICS_PROP_KEYS).not.toContain('dna');
    expect(ANALYTICS_PROP_KEYS).not.toContain('trait');
    expect(ANALYTICS_PROP_KEYS).not.toContain('score');
    expect(ANALYTICS_PROP_KEYS).not.toContain('notes');
    expect(ANALYTICS_PROP_KEYS).not.toContain('equity');
    expect(ANALYTICS_PROP_KEYS).not.toContain('pnl');
    expect(ANALYTICS_PROP_KEYS).not.toContain('simulatedPnl');
    expect(ANALYTICS_PROP_KEYS).not.toContain('prompt');
  });

  it('includes core product funnel events', () => {
    expect(ANALYTICS_EVENTS).toEqual(
      expect.arrayContaining([
        'app_launch',
        'screen_open',
        'academy_complete',
        'replay_complete',
        'replay_started',
        'replay_completed',
        'replay_abandoned',
        'mentor_open',
        'paywall_view',
        'session_heartbeat',
      ]),
    );
  });
});
