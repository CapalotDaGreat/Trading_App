import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
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
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  unlink,
  updateProfile,
  type MultiFactorResolver,
  type AuthCredential,
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
let pendingMfaPurpose: 'sign-in' | 'reauthenticate' | null = null;
let pendingTotpSecret: TotpSecret | null = null;
let sensitiveActionAuthorizedAt = 0;
let sensitiveActionAuthorizedUid: string | null = null;

export function getPendingMfaResolver(): MultiFactorResolver | null {
  return pendingMfaResolver;
}

export function clearPendingMfaResolver(): void {
  pendingMfaResolver = null;
  pendingMfaPurpose = null;
}

export function isPendingMfaReauthentication(): boolean {
  return pendingMfaPurpose === 'reauthenticate';
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
    'auth/requires-recent-login': 'Recent sign-in required. Reauthenticate and try again.',
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
      pendingMfaPurpose = 'sign-in';
      throw error;
    }
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  clearPendingMfaResolver();
  sensitiveActionAuthorizedAt = 0;
  sensitiveActionAuthorizedUid = null;
  if (!isFirebaseConfigured() || !auth) {
    return;
  }
  await signOut(auth);
}

export async function deleteCurrentAccount(): Promise<void> {
  if (!isFirebaseConfigured()) {
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
  return signInWithCredentialAndMfa(credential);
}

/** Cryptographically random nonce for Apple ID token binding (Firebase recommended). */
async function createAppleSignInNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Crypto.randomUUID().replace(/-/g, '') + Crypto.randomUUID().replace(/-/g, '');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, hashedNonce };
}

async function requestAppleCredential() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS.');
  }

  const { rawNonce, hashedNonce } = await createAppleSignInNonce();

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In failed: missing identity token.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  return { credential, fullName: appleCredential.fullName };
}

export async function signInWithApple(): Promise<User> {
  const { credential, fullName } = await requestAppleCredential();
  const resultUser = await signInWithCredentialAndMfa(credential);

  if (fullName?.givenName && !resultUser.displayName) {
    const displayName = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ');
    if (displayName) {
      await updateProfile(resultUser, { displayName });
    }
  }

  return resultUser;
}

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function enrollTotpMfa(): Promise<MfaEnrollmentResult> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('You must be signed in to enroll MFA.');
  }

  requireSensitiveActionAuthorization();

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
  const wasReauthentication = pendingMfaPurpose === 'reauthenticate';
  clearPendingMfaResolver();
  if (wasReauthentication) {
    sensitiveActionAuthorizedAt = Date.now();
    sensitiveActionAuthorizedUid = result.user.uid;
  }
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

  requireSensitiveActionAuthorization();
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

const SENSITIVE_ACTION_WINDOW_MS = 5 * 60 * 1000;

function requireSensitiveActionAuthorization(): void {
  if (!hasSensitiveActionAuthorization()) {
    throw {
      code: 'auth/requires-recent-login',
      message: 'Reauthenticate from Privacy & Security before managing MFA.',
    };
  }
}

export function hasSensitiveActionAuthorization(): boolean {
  return (
    sensitiveActionAuthorizedUid != null &&
    sensitiveActionAuthorizedUid === auth?.currentUser?.uid &&
    Date.now() - sensitiveActionAuthorizedAt <= SENSITIVE_ACTION_WINDOW_MS
  );
}

async function signInWithCredentialAndMfa(credential: AuthCredential): Promise<User> {
  try {
    const result = await signInWithCredential(getAuthOrThrow(), credential);
    return result.user;
  } catch (error) {
    const authError = error as { code?: string };
    if (authError.code === 'auth/multi-factor-auth-required') {
      pendingMfaResolver = getMultiFactorResolver(getAuthOrThrow(), error as never);
      pendingMfaPurpose = 'sign-in';
    }
    throw error;
  }
}

async function reauthenticate(credential: AuthCredential): Promise<User> {
  const user = getAuthOrThrow().currentUser;
  if (!user) {
    throw new Error('You must be signed in to reauthenticate.');
  }
  try {
    const result = await reauthenticateWithCredential(user, credential);
    sensitiveActionAuthorizedAt = Date.now();
    sensitiveActionAuthorizedUid = result.user.uid;
    return result.user;
  } catch (error) {
    const authError = error as { code?: string };
    if (authError.code === 'auth/multi-factor-auth-required') {
      pendingMfaResolver = getMultiFactorResolver(getAuthOrThrow(), error as never);
      pendingMfaPurpose = 'reauthenticate';
    }
    throw error;
  }
}

export async function reauthenticateWithPassword(password: string): Promise<User> {
  const user = getAuthOrThrow().currentUser;
  if (!user?.email) {
    throw new Error('This account does not have an email address for password reauthentication.');
  }
  return reauthenticate(EmailAuthProvider.credential(user.email, password));
}

export async function reauthenticateWithGoogleIdToken(idToken: string): Promise<User> {
  return reauthenticate(GoogleAuthProvider.credential(idToken));
}

export async function reauthenticateWithApple(): Promise<User> {
  const { credential } = await requestAppleCredential();
  return reauthenticate(credential);
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
