import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { logSecurityEvent, requireAppCheck, requireAuth } from '../security';
import { recordDailyCounter } from './aggregates';

const callableOpts = {
  enforceAppCheck: false,
  timeoutSeconds: 15,
  memory: '256MiB' as const,
};

/** Allowlisted product analytics events — no journal/AI/portfolio payloads. */
export const ALLOWED_ANALYTICS_EVENTS = new Set([
  'app_launch',
  'screen_open',
  'feature_use',
  'academy_complete',
  'replay_complete',
  'mentor_open',
  'passport_open',
  'decision_graph_open',
  'alert_create',
  'search',
  'watchlist_add',
  'paywall_view',
  'subscribe_start',
  'session_heartbeat',
  'perf_cold_start',
  'perf_warm_start',
  'perf_screen_load',
  'perf_api_latency',
  'perf_cache_hit',
]);

const ALLOWED_PROP_KEYS = new Set([
  'screen',
  'feature',
  'tier',
  'channel',
  'platform',
  'durationMs',
  'latencyMs',
  'cacheResult',
  'count',
  'lessonId',
  'outcome',
]);

const rateWindow = new Map<string, { count: number; resetAt: number }>();

function rateLimit(uid: string, maxPerMinute = 60): boolean {
  const now = Date.now();
  const row = rateWindow.get(uid);
  if (!row || row.resetAt < now) {
    rateWindow.set(uid, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (row.count >= maxPerMinute) return false;
  row.count += 1;
  return true;
}

function sanitizeProps(input: unknown): Record<string, string | number | boolean> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_PROP_KEYS.has(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 64);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
  }
  return out;
}

export const trackProductEvent = onCall(callableOpts, async (request) => {
  requireAppCheck(request);
  const uid = requireAuth(request);

  if (request.data?.consent !== true) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Product analytics consent required.',
    );
  }

  if (!rateLimit(uid)) {
    await logSecurityEvent({
      uid,
      endpoint: 'trackProductEvent',
      reason: 'analytics_rate_limited',
    });
    throw new functions.https.HttpsError('resource-exhausted', 'Analytics rate limited.');
  }

  const name = String(request.data?.name ?? '');
  if (!ALLOWED_ANALYTICS_EVENTS.has(name)) {
    throw new functions.https.HttpsError('invalid-argument', 'Event not allowed.');
  }

  const props = sanitizeProps(request.data?.props);
  const fields: Record<string, number> = {
    events: 1,
    [`evt_${name}`]: 1,
  };
  if (typeof props.durationMs === 'number') {
    fields.sessionDurationMsSum = Math.min(props.durationMs, 3_600_000);
  }
  if (typeof props.latencyMs === 'number') {
    fields.apiLatencyMsSum = Math.min(props.latencyMs, 60_000);
    fields.apiLatencySamples = 1;
  }

  await recordDailyCounter('daily', fields);
  return { ok: true };
});
