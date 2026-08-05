import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { SERVER_DEFAULT_REMOTE } from './ops/defaults';
import { isPremiumUser, logSecurityEvent } from './security';

export type QuotaBucket =
  | 'market_quote'
  | 'market_candles'
  | 'market_search'
  | 'economic_calendar'
  | 'news'
  | 'ai'
  | 'ai_mentor';

const FREE_DAILY: Record<Exclude<QuotaBucket, 'ai' | 'ai_mentor'>, number> = {
  market_quote: 120,
  market_candles: 60,
  market_search: 40,
  economic_calendar: 20,
  news: 30,
};

const PREMIUM_DAILY: Record<Exclude<QuotaBucket, 'ai' | 'ai_mentor'>, number> = {
  market_quote: 1_000,
  market_candles: 500,
  market_search: 200,
  economic_calendar: 100,
  news: 200,
};

/** -1 means unlimited (no ledger block). */
const FREE_MONTHLY_AI = SERVER_DEFAULT_REMOTE.aiAnalysisMonthlyFree ?? 20;
const PREMIUM_MONTHLY_AI = SERVER_DEFAULT_REMOTE.aiAnalysisMonthlyPremium ?? -1;
const FREE_MONTHLY_MENTOR = SERVER_DEFAULT_REMOTE.aiMentorMonthlyFree ?? 20;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function isAiBucket(bucket: QuotaBucket): boolean {
  return bucket === 'ai' || bucket === 'ai_mentor';
}

function aiLimit(premium: boolean, bucket: QuotaBucket): number {
  if (bucket === 'ai_mentor') return premium ? -1 : FREE_MONTHLY_MENTOR;
  return premium ? PREMIUM_MONTHLY_AI : FREE_MONTHLY_AI;
}

/**
 * Atomically consume one unit from the usage ledger.
 * Daily path: usage/{uid}/daily/{yyyy-mm-dd}
 * Monthly AI path: usage/{uid}/monthly/{yyyy-mm}
 */
export async function consumeQuota(uid: string, bucket: QuotaBucket): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const premium = await isPremiumUser(uid);

  if (isAiBucket(bucket)) {
    const limit = aiLimit(premium, bucket);
    if (limit < 0) {
      return { used: 0, limit: -1, remaining: -1 };
    }
    const month = monthKey();
    const ref = admin.firestore().collection('usage').doc(uid).collection('monthly').doc(month);
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
          month,
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
        meta: { used: result.used, limit: result.limit, period: 'monthly' },
      });
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Monthly ${bucket.replace(/_/g, ' ')} allowance reached. Resets next calendar month.`,
      );
    }

    return {
      used: result.used,
      limit: result.limit,
      remaining: Math.max(0, result.limit - result.used),
    };
  }

  const dailyBucket = bucket as Exclude<QuotaBucket, 'ai' | 'ai_mentor'>;
  const limit = (premium ? PREMIUM_DAILY : FREE_DAILY)[dailyBucket];
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
