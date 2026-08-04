import { ANALYTICS_EVENTS, ANALYTICS_PROP_KEYS } from '../events';

describe('analytics allowlist', () => {
  it('never includes sensitive event names', () => {
    const joined = ANALYTICS_EVENTS.join(',');
    expect(joined).not.toMatch(/journal|password|portfolio_value|ai_message|prompt/i);
  });

  it('never allows free-text prop keys', () => {
    expect(ANALYTICS_PROP_KEYS).not.toContain('notes');
    expect(ANALYTICS_PROP_KEYS).not.toContain('prompt');
    expect(ANALYTICS_PROP_KEYS).not.toContain('email');
  });

  it('includes core product funnel events', () => {
    expect(ANALYTICS_EVENTS).toEqual(
      expect.arrayContaining([
        'app_launch',
        'screen_open',
        'academy_complete',
        'replay_complete',
        'mentor_open',
        'paywall_view',
        'session_heartbeat',
      ]),
    );
  });
});
