/* eslint-disable import/first */
const mockCanUseFirestore = jest.fn();

jest.mock('@/firebase/config', () => ({
  canUseFirestore: (uid: string | null | undefined) => mockCanUseFirestore(uid),
}));

import { resolveUserDataBackend } from '../resolver';

describe('resolveUserDataBackend', () => {
  beforeEach(() => mockCanUseFirestore.mockReset());

  it('selects Firestore only when the uid can use it', () => {
    mockCanUseFirestore.mockImplementation((uid) => uid === 'firebase-user');

    expect(resolveUserDataBackend('firebase-user')).toBe('firestore');
    expect(resolveUserDataBackend('demo-guest')).toBe('local');
    expect(resolveUserDataBackend(undefined)).toBe('local');
  });
});
