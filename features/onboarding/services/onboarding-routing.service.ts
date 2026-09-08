import type { OnboardingResolution } from '../types/onboarding.types';
import { DEMO_USER_UID } from '@/firebase/config';

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
  const inLegal = firstSegment === 'legal';
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
      return inAuth || inLegal ? null : '/(auth)/welcome';
    }
  }

  if (status !== 'authenticated') return null;
  if (!onboarding) return null;
  // New users: Mentor Setup is required before tabs.
  if (!onboarding.completed) {
    return inOnboarding || inActivationCompanion || inLegal ? null : '/onboarding';
  }
  // Soft invite path: allow /onboarding until Mentor Setup is finished.
  if (inOnboarding && !mentorSetupCompleted) return null;
  if (inOnboarding || inAuth) return '/(tabs)';
  return null;
}

const DEMO_UID = DEMO_USER_UID;

/** Local, synchronous onboarding snapshot — never blocks first paint. */
export function localOnboardingResolution(input: {
  uid: string;
  completed: boolean;
}): OnboardingResolution {
  const isDemo = input.uid === DEMO_UID;
  return {
    completed: input.completed,
    experience: isDemo ? 'demo_guide' : 'full',
    reason: input.completed ? 'explicit_completion' : isDemo ? 'demo_guide' : 'new_user',
    shouldPersistCompletion: false,
  };
}

/**
 * Wait for Firestore reconcile only when a signed-in cloud user has not
 * already completed onboarding locally. Guest/demo and returning users paint immediately.
 */
export function shouldBlockOnOnboardingReconcile(input: {
  firebaseConfigured: boolean;
  authenticated: boolean;
  localCompleted: boolean;
}): boolean {
  if (!input.authenticated) return false;
  if (!input.firebaseConfigured) return false;
  if (input.localCompleted) return false;
  return true;
}
