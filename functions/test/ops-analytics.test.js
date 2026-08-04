const test = require('node:test');
const assert = require('node:assert/strict');

// Mirror allowlist from analytics.ts for deploy-time guardrails.
const ALLOWED = new Set([
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

test('ops analytics allowlist excludes sensitive names', () => {
  for (const name of ALLOWED) {
    assert.equal(/journal|password|prompt|portfolio_value|email/i.test(name), false);
  }
  assert.equal(ALLOWED.has('app_launch'), true);
  assert.equal(ALLOWED.has('ai_prompt'), false);
});
