import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';

import { consumeQuota } from './quota';
import {
  isPremiumUser,
  requireAppCheck,
  requireAuth,
  requirePremium,
  sanitizeVendorError,
} from './security';
import {
  parseInterval,
  parseLimit,
  parseMarketType,
  parseQuery,
  parseSymbol,
} from './validation';
import {
  alphaVantageCandles,
  alphaVantageQuote,
  finnhubCandles,
  finnhubEconomicCalendar,
  finnhubQuote,
  finnhubSearch,
  newsApiHeadlines,
} from './vendors';
import { recordAiOps } from './ops/ai-ops';
import { SERVER_DEFAULT_REMOTE } from './ops/defaults';

const callableOpts = {
  // Soft-enforce via requireAppCheck when APP_CHECK_ENFORCE=false (Expo Go rollout).
  enforceAppCheck: false,
  timeoutSeconds: 30,
  memory: '256MiB' as const,
};

function invalidArg(message: string): never {
  throw new functions.https.HttpsError('invalid-argument', message);
}

async function gate(request: CallableRequest, bucket: Parameters<typeof consumeQuota>[1]) {
  requireAppCheck(request);
  const uid = requireAuth(request);
  const quota = await consumeQuota(uid, bucket);
  return { uid, quota };
}

export const marketQuote = onCall(callableOpts, async (request) => {
  const { quota } = await gate(request, 'market_quote');
  let symbol: string;
  try {
    symbol = parseSymbol(request.data?.symbol);
  } catch {
    invalidArg('Invalid symbol.');
  }

  try {
    let quote = await finnhubQuote(symbol);
    let provider: 'finnhub' | 'alpha-vantage' = 'finnhub';
    if (!quote) {
      quote = await alphaVantageQuote(symbol);
      provider = 'alpha-vantage';
    }
    if (!quote) {
      throw new functions.https.HttpsError('not-found', 'Quote unavailable for this symbol.');
    }
    return {
      quote: { symbol, ...quote, currency: 'USD' },
      provider,
      kind: 'delayed' as const,
      fetchedAt: Date.now(),
      quota,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

export const marketCandles = onCall(callableOpts, async (request) => {
  const { quota } = await gate(request, 'market_candles');
  let symbol: string;
  let interval: string;
  let limit: number;
  let marketType: string;
  try {
    symbol = parseSymbol(request.data?.symbol);
    interval = parseInterval(request.data?.interval ?? '1d');
    limit = parseLimit(request.data?.limit, 500);
    marketType = parseMarketType(request.data?.marketType);
  } catch {
    invalidArg('Invalid candle request.');
  }

  try {
    let pack:
      | {
          candles: {
            timestamp: number;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }[];
          provider: 'finnhub' | 'alpha-vantage';
        }
      | null = await finnhubCandles(symbol, interval, limit, marketType);
    if (!pack && marketType !== 'forex') {
      pack = await alphaVantageCandles(symbol, interval, limit);
    }
    if (!pack) {
      throw new functions.https.HttpsError(
        'unavailable',
        marketType === 'forex'
          ? 'Forex candles unavailable.'
          : 'Candle data temporarily unavailable.',
      );
    }
    return {
      candles: pack.candles,
      provider: pack.provider,
      kind: 'delayed' as const,
      fetchedAt: Date.now(),
      quota,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

export const marketSearch = onCall(callableOpts, async (request) => {
  const { quota } = await gate(request, 'market_search');
  let query: string;
  try {
    query = parseQuery(request.data?.query, 64);
  } catch {
    invalidArg('Invalid search query.');
  }

  try {
    const results = await finnhubSearch(query);
    return { results, provider: 'finnhub' as const, quota };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

export const economicCalendar = onCall(callableOpts, async (request) => {
  const { quota } = await gate(request, 'economic_calendar');
  const from =
    typeof request.data?.from === 'string'
      ? request.data.from
      : new Date().toISOString().slice(0, 10);
  const to =
    typeof request.data?.to === 'string'
      ? request.data.to
      : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    invalidArg('Invalid calendar date range.');
  }

  try {
    const events = await finnhubEconomicCalendar(from, to);
    return { events, provider: 'finnhub' as const, quota };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

export const newsHeadlines = onCall(callableOpts, async (request) => {
  const { uid, quota } = await gate(request, 'news');
  const pageSize = parseLimit(request.data?.pageSize, 50);
  const page = parseLimit(request.data?.page ?? 1, 10);
  const category =
    typeof request.data?.category === 'string' ? request.data.category : 'business';
  let query: string | undefined;
  if (request.data?.query != null) {
    try {
      query = parseQuery(request.data.query, 100);
    } catch {
      invalidArg('Invalid news query.');
    }
  }

  // Premium gets higher quota via consumeQuota; free still allowed for soft access.
  void uid;

  try {
    const feed = await newsApiHeadlines({ query, category, pageSize, page });
    return { ...feed, source: 'newsapi' as const, quota };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

async function loadAiLimits(): Promise<{ free: number; premium: number; model: string }> {
  try {
    const snap = await admin
      .firestore()
      .collection('ops')
      .doc('config')
      .collection('docs')
      .doc('remote')
      .get();
    const data = snap.data() ?? {};
    return {
      free:
        typeof data.aiDailyLimitFree === 'number'
          ? data.aiDailyLimitFree
          : SERVER_DEFAULT_REMOTE.aiDailyLimitFree,
      premium:
        typeof data.aiDailyLimitPremium === 'number'
          ? data.aiDailyLimitPremium
          : SERVER_DEFAULT_REMOTE.aiDailyLimitPremium,
      model:
        typeof data.aiModel === 'string' ? data.aiModel : SERVER_DEFAULT_REMOTE.aiModel,
    };
  } catch {
    return {
      free: SERVER_DEFAULT_REMOTE.aiDailyLimitFree,
      premium: SERVER_DEFAULT_REMOTE.aiDailyLimitPremium,
      model: SERVER_DEFAULT_REMOTE.aiModel,
    };
  }
}

/**
 * Cloud AI stub — auth, App Check, premium, and quota enforced.
 * Returns failed-precondition until a provider is approved (CLOUD_AI server flag).
 * Records metadata-only AI ops (never prompts).
 */
export const aiAnalysis = onCall(callableOpts, async (request) => {
  const started = Date.now();
  requireAppCheck(request);
  const uid = requireAuth(request);
  await requirePremium(uid);
  await consumeQuota(uid, 'ai');
  const limits = await loadAiLimits();
  await recordAiOps({
    ok: false,
    latencyMs: Date.now() - started,
    model: limits.model,
    category: 'cloud_stub',
    fallback: true,
  });
  throw new functions.https.HttpsError(
    'failed-precondition',
    'Cloud AI is not enabled for this release. Local educational analysis remains available in the app.',
  );
});

/** Record local-engine AI usage against the server ledger when signed in. */
export const recordAiUsage = onCall(callableOpts, async (request) => {
  const started = Date.now();
  requireAppCheck(request);
  const uid = requireAuth(request);
  const quota = await consumeQuota(uid, 'ai');
  const limits = await loadAiLimits();
  const category =
    typeof request.data?.category === 'string'
      ? String(request.data.category).slice(0, 40)
      : 'local_engine';
  await recordAiOps({
    ok: true,
    latencyMs: Date.now() - started,
    model: limits.model,
    category,
    fallback: false,
    estTokens: typeof request.data?.estTokens === 'number' ? request.data.estTokens : undefined,
  });
  return { ok: true, quota };
});

export const getAiQuota = onCall(callableOpts, async (request) => {
  requireAppCheck(request);
  const uid = requireAuth(request);
  const day = new Date().toISOString().slice(0, 10);
  const snap = await admin
    .firestore()
    .collection('usage')
    .doc(uid)
    .collection('daily')
    .doc(day)
    .get();
  const used = (snap.data()?.counts as Record<string, number> | undefined)?.ai ?? 0;
  const premium = await isPremiumUser(uid);
  const limits = await loadAiLimits();
  const limit = premium ? limits.premium : limits.free;
  return {
    usedToday: used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: new Date(`${day}T24:00:00.000Z`).getTime(),
    model: limits.model,
  };
});
