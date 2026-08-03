import { mapRecoverableError } from '../error-recovery';

describe('mapRecoverableError', () => {
  it('maps offline context', () => {
    const mapped = mapRecoverableError(new Error('x'), { offline: true });
    expect(mapped.kind).toBe('offline');
    expect(mapped.recovery.toLowerCase()).toContain('reconnect');
  });

  it('maps timeout, auth, quota, and subscription failures', () => {
    expect(mapRecoverableError(new Error('Request timed out')).kind).toBe('timeout');
    expect(mapRecoverableError({ message: 'unauthenticated', code: 401 }).kind).toBe('auth');
    expect(mapRecoverableError({ message: 'quota exceeded', code: 429 }).kind).toBe('quota');
    expect(mapRecoverableError(new Error('subscription entitlement missing')).kind).toBe(
      'subscription',
    );
  });

  it('always explains what, why, and recovery', () => {
    const mapped = mapRecoverableError(new Error('weird failure'));
    expect(mapped.title.length).toBeGreaterThan(3);
    expect(mapped.why.length).toBeGreaterThan(3);
    expect(mapped.recovery.length).toBeGreaterThan(3);
    expect(mapped.actionLabel.length).toBeGreaterThan(2);
  });
});
