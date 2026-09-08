import type { OnboardingResolution } from '../../types/onboarding.types';
import {
  localOnboardingResolution,
  resolveRootRedirect,
  shouldBlockOnOnboardingReconcile,
} from '../onboarding-routing.service';

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

  it('lets guests and new users read in-app legal pages without leaving the flow', () => {
    expect(
      resolveRootRedirect({
        status: 'unauthenticated',
        firebaseConfigured: true,
        firstSegment: 'legal',
        onboarding: null,
      }),
    ).toBeNull();
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: true,
        firstSegment: 'legal',
        onboarding: incomplete,
      }),
    ).toBeNull();
  });

  it('sends completed and migrated users out of onboarding without a loop', () => {
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: true,
        firstSegment: 'onboarding',
        onboarding: complete,
        mentorSetupCompleted: true,
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

  it('allows soft-invite Mentor Setup for completed users without mentorSetupCompleted', () => {
    expect(
      resolveRootRedirect({
        status: 'authenticated',
        firebaseConfigured: true,
        firstSegment: 'onboarding',
        onboarding: complete,
        mentorSetupCompleted: false,
      }),
    ).toBeNull();
  });

  it('does not block first paint for guest/demo or locally completed users', () => {
    expect(
      shouldBlockOnOnboardingReconcile({
        firebaseConfigured: false,
        authenticated: true,
        localCompleted: false,
      }),
    ).toBe(false);
    expect(
      shouldBlockOnOnboardingReconcile({
        firebaseConfigured: true,
        authenticated: true,
        localCompleted: true,
      }),
    ).toBe(false);
    expect(
      shouldBlockOnOnboardingReconcile({
        firebaseConfigured: true,
        authenticated: true,
        localCompleted: false,
      }),
    ).toBe(true);
    expect(
      localOnboardingResolution({ uid: 'demo-guest', completed: false }).experience,
    ).toBe('demo_guide');
    expect(localOnboardingResolution({ uid: 'cloud-user', completed: true }).reason).toBe(
      'explicit_completion',
    );
  });
});
