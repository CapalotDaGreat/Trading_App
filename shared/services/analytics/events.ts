/** Strict allowlist — never journal text, AI chats, or portfolio values. */
export const ANALYTICS_EVENTS = [
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
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const ANALYTICS_PROP_KEYS = [
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
] as const;

export type AnalyticsPropKey = (typeof ANALYTICS_PROP_KEYS)[number];

export type AnalyticsProps = Partial<Record<AnalyticsPropKey, string | number | boolean>>;

export const PRODUCT_ANALYTICS_CONSENT_VERSION = 1;
