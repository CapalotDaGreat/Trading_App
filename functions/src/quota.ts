import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { isPremiumUser, logSecurityEvent } from './security';

export type QuotaBucket =
  | 'market_quote'
  | 'market_candles'
  | 'market_search'
  | 'economic_calendar'
  | 'news'
  | 'ai';

const FREE_DAILY: Record<QuotaBucket, number> = {
  market_quote: 120,
  market_candles: 60,
  market_search: 40,
  economic_calendar: 20,
  news: 30,
  ai: 10,
};

const PREMIUM_DAILY: Record<QuotaBucket, number> = {
  market_quote: 1_000,
  market_candles: 500,
  market_search: 200,
  economic_calendar: 100,
  news: 200,
  ai: 100,
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically consume one unit from the daily usage ledger.
 * Path: usage/{uid}/daily/{yyyy-mm-dd}
 */
export async function consumeQuota(uid: string, bucket: QuotaBucket): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const premium = await isPremiumUser(uid);
  const limit = (premium ? PREMIUM_DAILY : FREE_DAILY)[bucket];
  const day = todayKey();
  const ref = admin.firestore().collection('usage').doc(uid).collection('daily').doc(day);

  const result = await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const counts = (data.counts as Record<string, number> | undefined) ?? {};
    const used = typeof counts[bucket] === 'number' ? counts[bucket] : 0;
    if (used >= limit) {
      return { blocked: true as const, used, limit };
    }
    const next = used + 1;
    tx.set(
      ref,
      {
        uid,
        day,
        counts: { ...counts, [bucket]: next },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { blocked: false as const, used: next, limit };
  });

  if (result.blocked) {
    await logSecurityEvent({
      uid,
      endpoint: bucket,
      reason: 'quota_exceeded',
      meta: { used: result.used, limit: result.limit },
    });
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `Daily ${bucket.replace(/_/g, ' ')} limit reached. Resets at midnight UTC.`,
    );
  }

  return {
    used: result.used,
    limit: result.limit,
    remaining: Math.max(0, result.limit - result.used),
  };
}
