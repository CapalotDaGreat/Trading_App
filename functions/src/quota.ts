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

/** Hard cap for AI daily limits — never treat negative as unlimited. */
export const AI_DAILY_HARD_MAX = 1_000;
export const VENDOR_BURST_PER_MINUTE = 40;
export const AI_BURST_PER_MINUTE = 15;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** UTC minute window, e.g. 2026-08-24T12-03 */
export function burstWindowKey(now = new Date()): string {
  return now.toISOString().slice(0, 16).replace(':', '-');
}

function isAiBucket(bucket: QuotaBucket): boolean {
  return bucket === 'ai' || bucket === 'ai_mentor';
}

export function clampAiDailyLimit(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.min(AI_DAILY_HARD_MAX, Math.round(n)));
}

/**
 * Ledger counts must be finite non-negative numbers.
 * Malformed values fail closed (treated as exhausted).
 */
export function readLedgerCount(
  counts: unknown,
  key: string,
): { used: number; malformed: boolean } {
  if (!counts || typeof counts !== 'object') return { used: 0, malformed: false };
  const val = (counts as Record<string, unknown>)[key];
  if (val === undefined) return { used: 0, malformed: false };
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return { used: val, malformed: false };
  }
  return { used: 0, malformed: true };
}

function asCountMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}

async function aiDailyLimit(premium: boolean): Promise<number> {
  let remote: Record<string, unknown> = {};
  try {
    const snap = await admin
      .firestore()
      .collection('ops')
      .doc('config')
      .collection('docs')
      .doc('remote')
      .get();
    remote = snap.data() ?? {};
  } catch {
    // Release-safe defaults remain authoritative when ops config is unavailable.
  }
  const configured = premium ? remote.aiDailyLimitPremium : remote.aiDailyLimitFree;
  const fallback = premium
    ? SERVER_DEFAULT_REMOTE.aiDailyLimitPremium
    : SERVER_DEFAULT_REMOTE.aiDailyLimitFree;
  return clampAiDailyLimit(configured, fallback);
}

/**
 * Atomically consume one unit from the usage ledger (daily + per-minute burst).
 * Daily path: usage/{uid}/daily/{yyyy-mm-dd}
 * Burst path: usage/{uid}/burst/{yyyy-mm-ddTHH-MM}
 * Ask / mentor share the `ai` daily count.
 */
export async function consumeQuota(
  uid: string,
  bucket: QuotaBucket,
): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const premium = await isPremiumUser(uid);
  const limit = isAiBucket(bucket)
    ? await aiDailyLimit(premium)
    : (premium ? PREMIUM_DAILY : FREE_DAILY)[bucket as Exclude<QuotaBucket, 'ai' | 'ai_mentor'>];
  const dailyField = isAiBucket(bucket) ? 'ai' : bucket;
  const burstField = isAiBucket(bucket) ? 'ai' : 'vendor';
  const burstLimit = isAiBucket(bucket) ? AI_BURST_PER_MINUTE : VENDOR_BURST_PER_MINUTE;
  const day = todayKey();
  const windowId = burstWindowKey();
  const dailyRef = admin.firestore().collection('usage').doc(uid).collection('daily').doc(day);
  const burstRef = admin.firestore().collection('usage').doc(uid).collection('burst').doc(windowId);

  const result = await admin.firestore().runTransaction(async (tx) => {
    const [dailySnap, burstSnap] = await Promise.all([tx.get(dailyRef), tx.get(burstRef)]);
    const dailyCounts = dailySnap.data()?.counts;
    const burstCounts = burstSnap.data()?.counts;
    const daily = readLedgerCount(dailyCounts, dailyField);
    const burst = readLedgerCount(burstCounts, burstField);

    if (daily.malformed || burst.malformed || daily.used >= limit || burst.used >= burstLimit) {
      return {
        blocked: true as const,
        used: daily.malformed ? limit : daily.used,
        limit,
        reason: burst.malformed || burst.used >= burstLimit ? 'burst' : 'daily',
      };
    }

    const nextDaily = daily.used + 1;
    const nextBurst = burst.used + 1;
    tx.set(
      dailyRef,
      {
        uid,
        day,
        counts: { ...asCountMap(dailyCounts), [dailyField]: nextDaily },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    tx.set(
      burstRef,
      {
        uid,
        windowId,
        counts: { ...asCountMap(burstCounts), [burstField]: nextBurst },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { blocked: false as const, used: nextDaily, limit, reason: 'ok' as const };
  });

  if (result.blocked) {
    await logSecurityEvent({
      uid,
      endpoint: bucket,
      reason: result.reason === 'burst' ? 'burst_exceeded' : 'quota_exceeded',
      meta: { used: result.used, limit: result.limit, period: result.reason },
    });
    throw new functions.https.HttpsError(
      'resource-exhausted',
      result.reason === 'burst'
        ? 'Too many requests. Wait a minute and try again.'
        : isAiBucket(bucket)
          ? 'Daily AI allowance reached. Resets at midnight UTC.'
          : `Daily ${bucket.replace(/_/g, ' ')} limit reached. Resets at midnight UTC.`,
    );
  }

  return {
    used: result.used,
    limit: result.limit,
    remaining: Math.max(0, result.limit - result.used),
  };
}
