import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  TotpMultiFactorGenerator,
  TotpSecret,
  User,
  createUserWithEmailAndPassword,
  getMultiFactorResolver,
  linkWithCredential,
  multiFactor,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  unlink,
  updateProfile,
  type MultiFactorResolver,
  type Auth,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { Platform } from 'react-native';

import { auth, isFirebaseConfigured, requireAuth, requireFunctions } from '@/firebase/config';

import type {
  AuthServiceError,
  MfaChallengeState,
  MfaEnrollmentResult,
  MfaVerifyParams,
  SignInParams,
  SignUpParams,
} from '../types/auth.types';

WebBrowser.maybeCompleteAuthSession();

let pendingMfaResolver: MultiFactorResolver | null = null;
let pendingTotpSecret: TotpSecret | null = null;

export function getPendingMfaResolver(): MultiFactorResolver | null {
  return pendingMfaResolver;
}

export function clearPendingMfaResolver(): void {
  pendingMfaResolver = null;
}

export function mapAuthError(error: unknown): AuthServiceError {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code ?? 'auth/unknown';
  const message = firebaseError.message ?? 'An unexpected authentication error occurred.';

  const friendlyMessages: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/multi-factor-auth-required': 'Multi-factor authentication is required.',
    'auth/invalid-verification-code': 'Invalid verification code.',
    'auth/missing-multi-factor-info': 'No MFA factor found for this account.',
    'auth/requires-recent-login':
      'Recent sign-in required. Sign out, sign back in, and try account deletion again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  };

  return {
    code,
    message: friendlyMessages[code] ?? message,
  };
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

function getAuthOrThrow(): Auth {
  return requireAuth();
}

export async function signInAnonymouslyUser(): Promise<User> {
  const result = await signInAnonymously(getAuthOrThrow());
  return result.user;
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
}: SignUpParams): Promise<User> {
  const result = await createUserWithEmailAndPassword(getAuthOrThrow(), email, password);

  if (displayName) {
    await updateProfile(result.user, { displayName });
  }

  await sendEmailVerification(result.user);
  return result.user;
}

export async function signInWithEmail({ email, password }: SignInParams): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(getAuthOrThrow(), email, password);
    return result.user;
  } catch (error) {
    const authError = error as { code?: string };
    if (authError.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(getAuthOrThrow(), error as never);
      pendingMfaResolver = resolver;
      throw error;
    }
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  clearPendingMfaResolver();
  if (!isFirebaseConfigured() || !auth) {
    return;
  }
  await signOut(auth);
}

export async function deleteCurrentAccount(): Promise<void> {
  if (!isFirebaseConfigured()) {
    await AsyncStorage.clear();
    return;
  }

  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('No authenticated user.');
  }

  const deleteAccount = httpsCallable(requireFunctions(), 'deleteAccount');
  try {
    await deleteAccount();
    await signOut(getAuthOrThrow());
    await AsyncStorage.clear();
  } catch (error) {
    const callableError = error as { code?: string };
    if (callableError.code === 'functions/failed-precondition') {
      throw {
        code: 'auth/requires-recent-login',
        message: 'Recent sign-in required. Sign out, sign back in, and try account deletion again.',
      };
    }
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthOrThrow(), email);
}

export async function sendVerificationEmail(): Promise<void> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('No authenticated user.');
  }
  await sendEmailVerification(user);
}

export async function reloadCurrentUser(): Promise<User | null> {
  if (!isFirebaseConfigured() || !auth) {
    return null;
  }
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  await user.reload();
  return auth.currentUser;
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(getAuthOrThrow(), credential);
  return result.user;
}

export async function signInWithApple(): Promise<User> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS.');
  }

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In failed: missing identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
  });

  const result = await signInWithCredential(getAuthOrThrow(), credential);

  if (appleCredential.fullName?.givenName && !result.user.displayName) {
    const displayName = [appleCredential.fullName.givenName, appleCredential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
  }

  return result.user;
}

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function enrollTotpMfa(): Promise<MfaEnrollmentResult> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('You must be signed in to enroll MFA.');
  }

  await reauthenticateIfNeeded(user);

  const session = await multiFactor(user).getSession();
  const totpSecret: TotpSecret = await TotpMultiFactorGenerator.generateSecret(session);
  pendingTotpSecret = totpSecret;

  const qrCodeUrl = totpSecret.generateQrCodeUrl(user.email ?? 'user', 'TradeVision AI');

  return {
    secret: totpSecret.secretKey,
    qrCodeUrl,
    enrollmentId: totpSecret.secretKey,
  };
}

export async function finalizeTotpEnrollment(
  verificationCode: string,
  displayName = 'Authenticator App',
): Promise<void> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('You must be signed in to enroll MFA.');
  }

  if (!pendingTotpSecret) {
    throw new Error('MFA enrollment session expired. Please start enrollment again.');
  }

  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
    pendingTotpSecret,
    verificationCode,
  );

  await multiFactor(user).enroll(assertion, displayName);
  pendingTotpSecret = null;
}

export async function verifyMfaSignIn({ verificationCode }: MfaVerifyParams): Promise<User> {
  const resolver = pendingMfaResolver;
  if (!resolver) {
    throw new Error('No MFA challenge in progress.');
  }

  const hint = resolver.hints[0];
  if (!hint) {
    throw new Error('No MFA factor available.');
  }

  let assertion;
  if (hint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
    assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, verificationCode);
  } else {
    throw new Error(
      'This MFA factor is not supported in TradeVision AI mobile. Use an authenticator app (TOTP) factor.',
    );
  }

  const result = await resolver.resolveSignIn(assertion);
  clearPendingMfaResolver();
  return result.user;
}

export function buildMfaChallengeState(resolver: MultiFactorResolver): MfaChallengeState {
  return {
    resolver,
    hints: resolver.hints.map((hint) => ({
      uid: hint.uid,
      displayName: hint.displayName ?? null,
      factorId: hint.factorId,
    })),
  };
}

export async function unenrollMfa(factorUid: string): Promise<void> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('You must be signed in to manage MFA.');
  }

  await reauthenticateIfNeeded(user);
  await multiFactor(user).unenroll(factorUid);
}

export function getEnrolledMfaFactors() {
  if (!isFirebaseConfigured() || !auth) {
    return [];
  }
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  return multiFactor(user).enrolledFactors;
}

async function reauthenticateIfNeeded(user: User): Promise<void> {
  if (!user.email) {
    return;
  }

  const lastSignIn = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).getTime()
    : 0;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  if (lastSignIn > fiveMinutesAgo) {
    return;
  }

  throw new Error(
    'Recent sign-in required. Please sign out and sign in again before enrolling MFA.',
  );
}

export async function linkEmailPassword(email: string, password: string): Promise<User> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('No authenticated user.');
  }

  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);
  await sendEmailVerification(result.user);
  return result.user;
}

export async function unlinkProvider(providerId: string): Promise<User> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('No authenticated user.');
  }

  return unlink(user, providerId);
}
