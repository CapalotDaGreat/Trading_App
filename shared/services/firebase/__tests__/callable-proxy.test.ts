jest.mock('@/firebase/config', () => ({
  auth: { currentUser: null },
  canUseFirestore: (uid?: string | null) => Boolean(uid) && uid !== 'demo-guest',
  DEMO_USER_UID: 'demo-guest',
  requireFunctions: () => ({}),
}));

import { canUseVendorProxyForUser } from '../callable-proxy';

describe('vendor proxy authorization', () => {
  it('rejects demo, anonymous, and unverified users', () => {
    expect(canUseVendorProxyForUser(null)).toBe(false);
    expect(canUseVendorProxyForUser({ uid: 'demo-guest', emailVerified: true })).toBe(false);
    expect(
      canUseVendorProxyForUser({ uid: 'anon-1', isAnonymous: true, emailVerified: false }),
    ).toBe(false);
    expect(
      canUseVendorProxyForUser({ uid: 'user-1', isAnonymous: false, emailVerified: false }),
    ).toBe(false);
  });

  it('allows only verified non-anonymous accounts', () => {
    expect(
      canUseVendorProxyForUser({ uid: 'user-1', isAnonymous: false, emailVerified: true }),
    ).toBe(true);
  });
});
