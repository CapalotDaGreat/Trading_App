import type { OnboardingResolution } from '../types/onboarding.types';

type AuthGateStatus =
  | 'idle'
  | 'loading'
  | 'unauthenticated'
  | 'authenticated'
  | 'email_verification_required'
  | 'mfa_required';

interface RootRouteGateInput {
  status: AuthGateStatus;
  firebaseConfigured: boolean;
  firstSegment?: string;
  secondSegment?: string;
  onboarding: OnboardingResolution | null;
  /** Phase X — when false, completed users may still open Mentor Setup (soft invite). */
  mentorSetupCompleted?: boolean;
}

export function resolveRootRedirect({
  status,
  firebaseConfigured,
  firstSegment,
  secondSegment,
  onboarding,
  mentorSetupCompleted = true,
}: RootRouteGateInput): string | null {
  const inAuth = firstSegment === '(auth)';
  const inOnboarding = firstSegment === 'onboarding';
  const inActivationCompanion = firstSegment === 'journal' || firstSegment === 'asset';

  if (firebaseConfigured) {
    if (status === 'idle' || status === 'loading') return null;
    if (status === 'mfa_required') {
      return inAuth && secondSegment === 'mfa' ? null : '/(auth)/mfa';
    }
    if (status === 'email_verification_required') {
      return inAuth && secondSegment === 'verify-email' ? null : '/(auth)/verify-email';
    }
    if (status === 'unauthenticated') {
      return inAuth ? null : '/(auth)/welcome';
    }
  }

  if (status !== 'authenticated') return null;
  if (!onboarding) return null;
  // New users: Mentor Setup is required before tabs.
  if (!onboarding.completed) return inOnboarding || inActivationCompanion ? null : '/onboarding';
  // Soft invite path: allow /onboarding until Mentor Setup is finished.
  if (inOnboarding && !mentorSetupCompleted) return null;
  if (inOnboarding || inAuth) return '/(tabs)';
  return null;
}
