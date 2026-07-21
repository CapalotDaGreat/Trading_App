import { hasEffectivePremiumAccess } from '../subscription-access';

describe('hasEffectivePremiumAccess', () => {
  const now = Date.parse('2026-07-21T12:00:00.000Z');

  it('retains cancelled benefits until the provider expiry', () => {
    expect(
      hasEffectivePremiumAccess(
        { status: 'cancelled', expiresAt: '2026-07-22T12:00:00.000Z' },
        now,
      ),
    ).toBe(true);
  });

  it('revokes access at expiry even when a cached status says active', () => {
    expect(
      hasEffectivePremiumAccess(
        { status: 'active', expiresAt: '2026-07-21T11:59:59.000Z' },
        now,
      ),
    ).toBe(false);
  });

  it('allows an unexpired billing grace period and rejects refunds', () => {
    expect(
      hasEffectivePremiumAccess(
        { status: 'grace_period', expiresAt: '2026-07-22T12:00:00.000Z' },
        now,
      ),
    ).toBe(true);
    expect(
      hasEffectivePremiumAccess(
        { status: 'refunded', expiresAt: '2026-07-22T12:00:00.000Z' },
        now,
      ),
    ).toBe(false);
  });
});
