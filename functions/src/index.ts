/** Firebase functions for server-owned subscriptions and account deletion. */
import { timingSafeEqual } from 'crypto';

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const PREMIUM_ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID ?? 'premium';
const MONTHLY_PRODUCT_ID = 'tradevision_premium_monthly';
const YEARLY_PRODUCT_ID = 'tradevision_premium_yearly';

export interface RevenueCatWebhookEvent {
  id: string;
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  new_product_id?: string;
  entitlement_ids?: string[];
  store?: string;
  event_timestamp_ms?: number;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  cancel_reason?: string;
}

export interface SubscriptionEventUpdate {
  status: 'active' | 'cancelled' | 'grace_period' | 'billing_issue' | 'expired' | 'refunded';
  tier: 'premium' | 'free';
  isPremium: boolean;
  willRenew: boolean;
  productId: string | null;
  planId: 'monthly' | 'yearly' | null;
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional' | 'unknown';
  purchasedAt: Date | null;
  expiresAt: Date | null;
  cancelledAt: Date | null;
}

function dateFromMs(value: number | null | undefined): Date | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value) : null;
}

function planFromProduct(productId: string | null): SubscriptionEventUpdate['planId'] {
  if (productId === MONTHLY_PRODUCT_ID) return 'monthly';
  if (productId === YEARLY_PRODUCT_ID) return 'yearly';
  return null;
}

function normalizeStore(store?: string): SubscriptionEventUpdate['store'] {
  switch (store?.toUpperCase()) {
    case 'APP_STORE':
    case 'MAC_APP_STORE':
      return 'app_store';
    case 'PLAY_STORE':
      return 'play_store';
    case 'STRIPE':
      return 'stripe';
    case 'PROMOTIONAL':
      return 'promotional';
    default:
      return 'unknown';
  }
}

export function mapRevenueCatEvent(event: RevenueCatWebhookEvent): SubscriptionEventUpdate | null {
  const productId = event.new_product_id ?? event.product_id ?? null;
  const purchasedAt = dateFromMs(event.purchased_at_ms);
  const normalExpiry = dateFromMs(event.expiration_at_ms);
  const eventAt = dateFromMs(event.event_timestamp_ms) ?? new Date();
  const base = {
    productId,
    planId: planFromProduct(productId),
    store: normalizeStore(event.store),
    purchasedAt,
  };

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      return {
        ...base,
        status: 'active',
        tier: 'premium',
        isPremium: true,
        willRenew: true,
        expiresAt: normalExpiry,
        cancelledAt: null,
      };
    case 'CANCELLATION':
      return {
        ...base,
        status: 'cancelled',
        tier: 'premium',
        isPremium: true,
        willRenew: false,
        expiresAt: normalExpiry,
        cancelledAt: eventAt,
      };
    case 'BILLING_ISSUE': {
      const graceExpiry = dateFromMs(event.grace_period_expiration_at_ms);
      return {
        ...base,
        status: graceExpiry ? 'grace_period' : 'billing_issue',
        tier: 'premium',
        isPremium: true,
        willRenew: true,
        expiresAt: graceExpiry ?? normalExpiry,
        cancelledAt: null,
      };
    }
    case 'EXPIRATION':
      return {
        ...base,
        status: 'expired',
        tier: 'free',
        isPremium: false,
        willRenew: false,
        expiresAt: normalExpiry ?? eventAt,
        cancelledAt: null,
      };
    case 'REFUND':
      return {
        ...base,
        status: 'refunded',
        tier: 'free',
        isPremium: false,
        willRenew: false,
        expiresAt: eventAt,
        cancelledAt: eventAt,
      };
    default:
      return null;
  }
}

export function isValidWebhookAuthorization(header: string | undefined, secret: string): boolean {
  if (!header || !secret) return false;
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header;
  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  return (
    providedBuffer.length === secretBuffer.length && timingSafeEqual(providedBuffer, secretBuffer)
  );
}

function isValidFirebaseUid(uid: string): boolean {
  return (
    uid.length > 0 && uid.length <= 128 && !uid.startsWith('$RCAnonymousID:') && !uid.includes('/')
  );
}

const RECENT_LOGIN_MAX_AGE_SECONDS = 5 * 60;

export function hasRecentLogin(
  authTime: unknown,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const signedInAt = typeof authTime === 'number' ? authTime : Number(authTime);
  return (
    Number.isFinite(signedInAt) &&
    signedInAt > 0 &&
    signedInAt <= nowSeconds &&
    nowSeconds - signedInAt <= RECENT_LOGIN_MAX_AGE_SECONDS
  );
}

export function accountDeletionPaths(uid: string): {
  userDocument: string;
  userSettingsDocument: string;
  subscriptionDocument: string;
  storagePrefix: string;
} {
  return {
    userDocument: `users/${uid}`,
    userSettingsDocument: `userSettings/${uid}`,
    subscriptionDocument: `subscriptions/${uid}`,
    storagePrefix: `users/${uid}/`,
  };
}

export const revenueCatWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST').status(405).send('Method not allowed');
    return;
  }

  const secret = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN ?? '';
  if (!isValidWebhookAuthorization(req.get('authorization'), secret)) {
    res.status(401).send('Unauthorized');
    return;
  }

  const event = (req.body as { event?: RevenueCatWebhookEvent })?.event;
  if (!event?.id || !event.type || !event.app_user_id) {
    res.status(400).send('Invalid RevenueCat event');
    return;
  }
  if (!isValidFirebaseUid(event.app_user_id)) {
    res.status(422).send('RevenueCat app user id must be a Firebase uid');
    return;
  }
  if (event.entitlement_ids && !event.entitlement_ids.includes(PREMIUM_ENTITLEMENT_ID)) {
    res.status(204).send();
    return;
  }

  const update = mapRevenueCatEvent(event);
  if (!update) {
    res.status(204).send();
    return;
  }

  const db = admin.firestore();
  const eventRef = db.collection('revenuecatWebhookEvents').doc(event.id);
  const subscriptionRef = db.collection('subscriptions').doc(event.app_user_id);
  const eventTimestamp = event.event_timestamp_ms ?? Date.now();

  try {
    await db.runTransaction(async (transaction) => {
      const [processed, current] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(subscriptionRef),
      ]);
      if (processed.exists) return;

      transaction.create(eventRef, {
        uid: event.app_user_id,
        type: event.type,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const currentEventTimestamp = current.data()?.lastEventTimestampMs as number | undefined;
      if (currentEventTimestamp && currentEventTimestamp > eventTimestamp) return;

      transaction.set(
        subscriptionRef,
        {
          uid: event.app_user_id,
          entitlementId: PREMIUM_ENTITLEMENT_ID,
          revenueCatAppUserId: event.app_user_id,
          status: update.status,
          tier: update.tier,
          isPremium: update.isPremium,
          willRenew: update.willRenew,
          productId: update.productId,
          planId: update.planId,
          store: update.store,
          purchasedAt: update.purchasedAt,
          expiresAt: update.expiresAt,
          cancelledAt: update.cancelledAt,
          lastEventId: event.id,
          lastEventType: event.type,
          lastEventTimestampMs: eventTimestamp,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'revenuecat_webhook',
        },
        { merge: true },
      );
    });
  } catch (error) {
    functions.logger.error('RevenueCat webhook processing failed', {
      eventId: event.id,
      type: event.type,
      error,
    });
    res.status(500).send('Webhook processing failed');
    return;
  }

  res.status(200).send('ok');
});

export const deleteAccount = functions.https.onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to delete your account.',
    );
  }
  if (!hasRecentLogin(request.auth?.token.auth_time)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Recent sign-in required. Sign out, sign back in, and try again.',
    );
  }

  const paths = accountDeletionPaths(uid);
  const db = admin.firestore();

  try {
    // Keep Auth deletion last so a partial failure can be retried by the same account.
    await admin.storage().bucket().deleteFiles({ prefix: paths.storagePrefix });
    await db.recursiveDelete(db.doc(paths.userDocument));
    await Promise.all([
      db.recursiveDelete(db.doc(paths.userSettingsDocument)),
      db.recursiveDelete(db.doc(paths.subscriptionDocument)),
    ]);
    await admin.auth().deleteUser(uid);
  } catch (error) {
    functions.logger.error('Account deletion failed', { uid, error });
    throw new functions.https.HttpsError(
      'internal',
      'Account deletion could not be completed. Please try again or contact support.',
    );
  }

  functions.logger.info('Account deleted', { uid });
  return { deleted: true };
});
