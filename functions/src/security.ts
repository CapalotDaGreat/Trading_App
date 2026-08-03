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

/**
 * App Check: fail closed only when APP_CHECK_ENFORCE=true (after debug tokens / native providers ready).
 * Default soft mode logs missing tokens so Expo Go / gradual rollout keep working.
 */
export function requireAppCheck(request: CallableRequest): void {
  if (process.env.FUNCTIONS_EMULATOR === 'true') return;
  if (request.app) return;

  void logSecurityEvent({
    uid: request.auth?.uid ?? null,
    endpoint: 'appcheck',
    reason: 'missing_or_invalid_app_check',
  });

  if (process.env.APP_CHECK_ENFORCE === 'true') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Could not verify this app installation. Update the app or try again later.',
    );
  }
}

export async function isPremiumUser(uid: string): Promise<boolean> {
  const snap = await db().collection('subscriptions').doc(uid).get();
  if (!snap.exists) return false;
  const data = snap.data() ?? {};
  if (data.isPremium !== true) return false;
  const expiresAt = data.expiresAt as admin.firestore.Timestamp | Date | null | undefined;
  if (!expiresAt) return true; // promotional grants may omit expiry
  const ms =
    typeof (expiresAt as admin.firestore.Timestamp).toMillis === 'function'
      ? (expiresAt as admin.firestore.Timestamp).toMillis()
      : new Date(expiresAt as Date).getTime();
  return Number.isFinite(ms) && ms > Date.now();
}

export async function requirePremium(uid: string): Promise<void> {
  if (!(await isPremiumUser(uid))) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This feature requires an active Premium subscription.',
    );
  }
}

export function sanitizeVendorError(error: unknown): never {
  const message = error instanceof Error ? error.message : 'upstream_error';
  functions.logger.warn('vendor.request_failed', { message: message.slice(0, 200) });
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
