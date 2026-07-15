import type { User, MultiFactorResolver } from 'firebase/auth';

export type AuthProviderId = 'password' | 'google.com' | 'apple.com' | 'anonymous';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'mfa_required'
  | 'email_verification_required';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerIds: AuthProviderId[];
}

export interface MfaEnrollmentResult {
  secret: string;
  qrCodeUrl: string;
  enrollmentId: string;
}

export interface MfaChallengeState {
  resolver: MultiFactorResolver;
  hints: Array<{
    uid: string;
    displayName: string | null;
    factorId: string;
  }>;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  firebaseUser: User | null;
  mfaChallenge: MfaChallengeState | null;
  error: string | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface MfaVerifyParams {
  verificationCode: string;
  enrollmentId?: string;
}

export interface AuthServiceError {
  code: string;
  message: string;
}

export function mapFirebaseUser(user: User): AuthUser {
  const providerIds = user.providerData
    .map((provider) => provider.providerId)
    .filter((id): id is AuthProviderId =>
      ['password', 'google.com', 'apple.com', 'anonymous'].includes(id),
    );

  if (user.isAnonymous && !providerIds.includes('anonymous')) {
    providerIds.push('anonymous');
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    providerIds,
  };
}
