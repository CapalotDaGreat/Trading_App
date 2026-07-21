import type { OnboardingResolution } from '../../types/onboarding.types';
import { resolveRootRedirect } from '../onboarding-routing.service';

const incomplete: OnboardingResolution = {
  completed: false,
  experience: 'full',
  reason: 'new_user',
  shouldPersistCompletion: false,
};
const complete: OnboardingResolution = {
  completed: true,
  experience: 'full',
  reason: 'explicit_completion',
  shouldPersistCompletion: false,
};

describe('root onboarding route gate', () => {
  it('keeps unverified and MFA users inside their auth guards', () => {
    expect(
      resolveRootRedirect({
        status: 'email_verification_required',
        firebaseConfigured: true,
        firstSegment: '(tabs)',
        onboarding: incomplete,
      }),
    ).toBe('/(auth)/verify-email');
    expect(
      resolveRootRedirect({
        status: 'mfa_required',
        firebaseConfigured: true,
        firstSegment: 'onboarding',
        onboarding: incomplete,
      }),
    ).toBe('/(auth)/mfa');
  });

  it('gates incomplete users while allowing activation journal and research companions', () => {
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: true,
        firstSegment: '(tabs)',
        onboarding: incomplete,
      }),
    ).toBe('/onboarding');
    for (const firstSegment of ['onboarding', 'journal', 'asset']) {
      expect(
        resolveRootRedirect({
          status: 'authenticated',
          firebaseConfigured: true,
          firstSegment,
          onboarding: incomplete,
        }),
      ).toBeNull();
    }
  });

  it('sends completed and migrated users out of onboarding without a loop', () => {
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: true,
        firstSegment: 'onboarding',
        onboarding: complete,
      }),
    ).toBe('/(tabs)');
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: false,
        firstSegment: '(tabs)',
        onboarding: complete,
      }),
    ).toBeNull();
  });
});
