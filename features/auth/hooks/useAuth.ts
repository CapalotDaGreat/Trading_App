import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useDecisionUiStore } from '@/features/decision/stores/decision-ui.store';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { subscriptionService } from '@/features/subscription/services/subscription.service';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  buildMfaChallengeState,
  clearPendingMfaResolver,
  deleteCurrentAccount,
  enrollTotpMfa,
  finalizeTotpEnrollment,
  getEnrolledMfaFactors,
  getPendingMfaResolver,
  mapAuthError,
  reloadCurrentUser,
  sendPasswordReset,
  sendVerificationEmail,
  signInAnonymouslyUser,
  signInWithApple,
  signInWithEmail,
  signInWithGoogleIdToken,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthState,
  unenrollMfa,
  verifyMfaSignIn,
} from '../services/auth.service';
import {
  mapFirebaseUser,
  type AuthState,
  type AuthUser,
  type MfaEnrollmentResult,
  type MfaVerifyParams,
  type SignInParams,
  type SignUpParams,
} from '../types/auth.types';

const DEMO_GUEST_USER: AuthUser = {
  uid: DEMO_USER_UID,
  email: null,
  displayName: 'Guest Trader',
  photoURL: null,
  emailVerified: false,
  isAnonymous: true,
  providerIds: ['anonymous'],
};

type AuthActionResult = 'success' | 'mfa_required';

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  signInAnonymously: () => Promise<AuthActionResult>;
  signUp: (params: SignUpParams) => Promise<AuthActionResult>;
  signIn: (params: SignInParams) => Promise<AuthActionResult>;
  signInWithGoogle: (idToken: string) => Promise<AuthActionResult>;
  signInWithAppleProvider: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  startMfaEnrollment: () => Promise<MfaEnrollmentResult>;
  completeMfaEnrollment: (verificationCode: string) => Promise<AuthActionResult>;
  verifyMfa: (params: MfaVerifyParams) => Promise<AuthActionResult>;
  removeMfaFactor: (factorUid: string) => Promise<AuthActionResult>;
  enrolledMfaFactors: ReturnType<typeof getEnrolledMfaFactors>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveStatus(user: AuthUser | null, mfaRequired: boolean): AuthState['status'] {
  if (mfaRequired) {
    return 'mfa_required';
  }
  if (!user) {
    return 'unauthenticated';
  }
  if (!user.isAnonymous && !user.emailVerified && user.email) {
    return 'email_verification_required';
  }
  return 'authenticated';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseReady = isFirebaseConfigured();
  const queryClient = useQueryClient();

  const [state, setState] = useState<AuthState>(() =>
    firebaseReady
      ? {
          status: 'loading',
          user: null,
          firebaseUser: null,
          mfaChallenge: null,
          error: null,
        }
      : {
          status: 'authenticated',
          user: DEMO_GUEST_USER,
          firebaseUser: null,
          mfaChallenge: null,
          error: null,
        },
  );

  useEffect(() => {
    if (!firebaseReady) {
      return;
    }

    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      const pendingResolver = getPendingMfaResolver();
      const user = firebaseUser ? mapFirebaseUser(firebaseUser) : null;
      const mfaRequired = Boolean(pendingResolver);
      if (useSubscriptionStore.getState().ownerUid !== user?.uid) {
        useSubscriptionStore.getState().reset();
      }

      setState({
        status: deriveStatus(user, mfaRequired),
        user,
        firebaseUser,
        mfaChallenge: pendingResolver ? buildMfaChallengeState(pendingResolver) : null,
        error: null,
      });
    });

    return unsubscribe;
  }, [firebaseReady]);

  const runAuthAction = useCallback(
    async (action: () => Promise<void>): Promise<AuthActionResult> => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        await action();
        setState((prev) => ({
          ...prev,
          status: deriveStatus(prev.user, Boolean(getPendingMfaResolver())),
          error: null,
        }));
        return 'success';
      } catch (error) {
        const authError = mapAuthError(error);
        const pendingResolver = getPendingMfaResolver();

        if (authError.code === 'auth/multi-factor-auth-required' && pendingResolver) {
          setState((prev) => ({
            ...prev,
            status: 'mfa_required',
            mfaChallenge: buildMfaChallengeState(pendingResolver),
            error: null,
          }));
          return 'mfa_required';
        }

        setState((prev) => ({
          ...prev,
          status: deriveStatus(prev.user, false),
          error: authError.message,
        }));
        throw error;
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isLoading: state.status === 'loading',
      signInAnonymously: () =>
        runAuthAction(async () => {
          if (!isFirebaseConfigured()) {
            setState({
              status: 'authenticated',
              user: DEMO_GUEST_USER,
              firebaseUser: null,
              mfaChallenge: null,
              error: null,
            });
            return;
          }
          await signInAnonymouslyUser();
        }),
      signUp: (params) =>
        runAuthAction(async () => {
          if (!isFirebaseConfigured()) {
            throw new Error(
              'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to your .env file.',
            );
          }
          await signUpWithEmail(params);
        }),
      signIn: (params) =>
        runAuthAction(async () => {
          if (!isFirebaseConfigured()) {
            throw new Error(
              'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to your .env file.',
            );
          }
          await signInWithEmail(params);
        }),
      signInWithGoogle: (idToken) =>
        runAuthAction(async () => {
          if (!isFirebaseConfigured()) {
            throw new Error(
              'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to your .env file.',
            );
          }
          await signInWithGoogleIdToken(idToken);
        }),
      signInWithAppleProvider: () =>
        runAuthAction(async () => {
          if (!isFirebaseConfigured()) {
            throw new Error(
              'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to your .env file.',
            );
          }
          await signInWithApple();
        }),
      signOut: async () => {
        clearPendingMfaResolver();
        useSubscriptionStore.getState().reset();
        await signOutUser();
        if (!isFirebaseConfigured()) {
          setState({
            status: 'authenticated',
            user: DEMO_GUEST_USER,
            firebaseUser: null,
            mfaChallenge: null,
            error: null,
          });
        }
      },
      deleteAccount: async () => {
        setState((prev) => ({ ...prev, error: null }));
        try {
          await deleteCurrentAccount();
          await subscriptionService.configureForUser(null);
          useSubscriptionStore.getState().reset();
          useAcademyProgressStore.getState().resetProgress();
          useDecisionLabStore.getState().resetAccount();
          useDecisionUiStore.setState({ dqsExplainerDismissed: false });
          queryClient.clear();
          setState(
            isFirebaseConfigured()
              ? {
                  status: 'unauthenticated',
                  user: null,
                  firebaseUser: null,
                  mfaChallenge: null,
                  error: null,
                }
              : {
                  status: 'authenticated',
                  user: DEMO_GUEST_USER,
                  firebaseUser: null,
                  mfaChallenge: null,
                  error: null,
                },
          );
        } catch (error) {
          const authError = mapAuthError(error);
          setState((prev) => ({ ...prev, error: authError.message }));
          throw error;
        }
      },
      resetPassword: async (email) => {
        await runAuthAction(async () => {
          await sendPasswordReset(email);
        });
      },
      resendVerificationEmail: async () => {
        await runAuthAction(async () => {
          await sendVerificationEmail();
        });
      },
      refreshUser: async () => {
        const firebaseUser = await reloadCurrentUser();
        const user = firebaseUser ? mapFirebaseUser(firebaseUser) : state.user;
        setState((prev) => ({
          ...prev,
          user,
          firebaseUser,
          status: deriveStatus(user, Boolean(getPendingMfaResolver())),
        }));
        return user;
      },
      startMfaEnrollment: async () => {
        setState((prev) => ({ ...prev, error: null }));
        try {
          return await enrollTotpMfa();
        } catch (error) {
          const authError = mapAuthError(error);
          setState((prev) => ({ ...prev, error: authError.message }));
          throw error;
        }
      },
      completeMfaEnrollment: (verificationCode) =>
        runAuthAction(async () => {
          await finalizeTotpEnrollment(verificationCode);
        }),
      verifyMfa: (params) =>
        runAuthAction(async () => {
          await verifyMfaSignIn(params);
        }),
      removeMfaFactor: (factorUid) =>
        runAuthAction(async () => {
          await unenrollMfa(factorUid);
        }),
      enrolledMfaFactors: getEnrolledMfaFactors(),
      clearError: () => setState((prev) => ({ ...prev, error: null })),
    }),
    [queryClient, runAuthAction, state],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
