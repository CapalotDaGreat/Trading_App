import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { CallableRequest } from 'firebase-functions/v2/https';

const db = () => admin.firestore();

export function requireAuth(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }
  return uid;
}

/** Vendor / paid-data callables require a verified, non-anonymous Firebase user. */
export function isVerifiedCallableUser(token?: {
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
} | null): boolean {
  if (!token) return false;
  if (token.firebase?.sign_in_provider === 'anonymous') return false;
  return token.email_verified === true;
}

export function requireVerifiedUser(request: CallableRequest): string {
  const uid = requireAuth(request);
  if (!isVerifiedCallableUser(request.auth?.token)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Verify your email to use live market data.',
    );
  }
  return uid;
}

/**
 * App Check is fail-closed by default.
 *
 * Soft (allow missing tokens, still log) only when:
 * - FUNCTIONS_EMULATOR=true
 * - APP_CHECK_SOFT=true (explicit staging / Expo Go against deployed Functions)
 *
 * `APP_CHECK_ENFORCE=false` is ignored outside the emulator so a leftover
 * Functions env var cannot leave production in a weak development configuration.
 *
 * Platform `enforceAppCheck` stays false so this helper remains the switch;
 * native DeviceCheck / Play Integrity must still be wired for tokens to verify.
 */
export function shouldEnforceAppCheck(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.FUNCTIONS_EMULATOR === 'true') return false;
  if (env.APP_CHECK_SOFT === 'true') return false;
  return true;
}

export function requireAppCheck(request: CallableRequest): void {
  if (process.env.FUNCTIONS_EMULATOR === 'true') return;
  if (request.app) return;

  void logSecurityEvent({
    uid: request.auth?.uid ?? null,
    endpoint: 'appcheck',
    reason: 'missing_or_invalid_app_check',
  });

  if (shouldEnforceAppCheck()) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Could not verify this app installation. Update the app or try again later.',
    );
  }
}

function expiryMillis(expiresAt: unknown): number | null {
  if (expiresAt == null) return null;
  if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) return expiresAt;
  if (expiresAt instanceof Date) {
    const ms = expiresAt.getTime();
    return Number.isFinite(ms) ? ms : NaN;
  }
  if (typeof expiresAt === 'object' && typeof (expiresAt as { toMillis?: unknown }).toMillis === 'function') {
    const ms = (expiresAt as admin.firestore.Timestamp).toMillis();
    return Number.isFinite(ms) ? ms : NaN;
  }
  if (typeof expiresAt === 'string') {
    const ms = Date.parse(expiresAt);
    return Number.isFinite(ms) ? ms : NaN;
  }
  return NaN;
}

/**
 * Server-side premium check. Never trust client isPremium / role / plan.
 * Missing expiry is not premium unless planId is lifetime or store is promotional.
 * Unparseable expiry fails closed (not premium).
 */
export function hasServerPremiumAccess(
  data: Record<string, unknown>,
  nowMs = Date.now(),
): boolean {
  if (data.isPremium !== true) return false;
  const planId = data.planId;
  const store = data.store;
  const lifetime = planId === 'lifetime';
  const promotional = store === 'promotional';
  const expiresAt = data.expiresAt;
  if (expiresAt == null || expiresAt === '') {
    return lifetime || promotional;
  }
  const ms = expiryMillis(expiresAt);
  if (ms == null) {
    return lifetime || promotional;
  }
  if (!Number.isFinite(ms)) return false;
  return ms > nowMs;
}

export async function isPremiumUser(uid: string): Promise<boolean> {
  const snap = await db().collection('subscriptions').doc(uid).get();
  if (!snap.exists) return false;
  return hasServerPremiumAccess((snap.data() ?? {}) as Record<string, unknown>);
}

export async function requirePremium(uid: string): Promise<void> {
  if (!(await isPremiumUser(uid))) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This feature requires an active Premium subscription.',
    );
  }
}

/** Ops admin is server-owned: opsAdmins/{uid} or custom claim set via Admin SDK. */
export async function requireOpsAdmin(
  uid: string,
  token?: Record<string, unknown>,
): Promise<void> {
  const adminSnap = await db().collection('opsAdmins').doc(uid).get();
  if (!adminSnap.exists && token?.opsAdmin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Ops admin required.');
  }
}

export function sanitizeVendorError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'upstream_error';
  functions.logger.warn('vendor.request_failed', { message: message.slice(0, 200) });
  if (message.includes('NOT_CONFIGURED') || message.includes('_not_configured')) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Market data is not configured.',
    );
  }
  if (message.includes('429') || /rate.?limit/i.test(message)) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Market data is temporarily rate-limited. Try again shortly.',
    );
  }
  if (message.includes('403') || message.includes('401')) {
    throw new functions.https.HttpsError(
      'unavailable',
      'Market data is temporarily unavailable.',
    );
  }
  throw new functions.https.HttpsError('unavailable', 'Market data is temporarily unavailable.');
}

export async function logSecurityEvent(input: {
  uid: string | null;
  endpoint: string;
  reason: string;
  meta?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    await db().collection('securityEvents').add({
      uid: input.uid,
      endpoint: input.endpoint,
      reason: input.reason,
      meta: input.meta ?? {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    functions.logger.warn('security_event_write_failed', { error });
  }
}
