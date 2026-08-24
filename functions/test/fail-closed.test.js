const assert = require('node:assert/strict');
const test = require('node:test');

const { hasServerPremiumAccess, shouldEnforceAppCheck } = require('../lib/security');
const { clampAiDailyLimit, readLedgerCount } = require('../lib/quota');
const {
  sanitizeFlagsPayload,
  sanitizeRemotePayload,
  mergeRemoteConfig,
} = require('../lib/ops/bootstrap');

test('App Check fails closed unless emulator or explicit soft mode', () => {
  assert.equal(shouldEnforceAppCheck({}), true);
  assert.equal(shouldEnforceAppCheck({ APP_CHECK_ENFORCE: 'true' }), true);
  assert.equal(shouldEnforceAppCheck({ FUNCTIONS_EMULATOR: 'true' }), false);
  assert.equal(shouldEnforceAppCheck({ APP_CHECK_SOFT: 'true' }), false);
  assert.equal(shouldEnforceAppCheck({ APP_CHECK_ENFORCE: 'false' }), false);
});

test('premium access fails closed without expiry unless lifetime or promotional', () => {
  const now = Date.parse('2026-08-24T12:00:00.000Z');
  assert.equal(hasServerPremiumAccess({}, now), false);
  assert.equal(hasServerPremiumAccess({ isPremium: true }, now), false);
  assert.equal(
    hasServerPremiumAccess({ isPremium: true, planId: 'yearly', expiresAt: null }, now),
    false,
  );
  assert.equal(
    hasServerPremiumAccess({ isPremium: true, planId: 'lifetime', expiresAt: null }, now),
    true,
  );
  assert.equal(
    hasServerPremiumAccess({ isPremium: true, store: 'promotional' }, now),
    true,
  );
  assert.equal(
    hasServerPremiumAccess(
      { isPremium: true, planId: 'yearly', expiresAt: new Date('2026-08-23T00:00:00.000Z') },
      now,
    ),
    false,
  );
  assert.equal(
    hasServerPremiumAccess(
      { isPremium: true, planId: 'yearly', expiresAt: new Date('2026-08-25T00:00:00.000Z') },
      now,
    ),
    true,
  );
  assert.equal(
    hasServerPremiumAccess({ isPremium: true, planId: 'yearly', expiresAt: 'not-a-date' }, now),
    false,
  );
  assert.equal(hasServerPremiumAccess({ isPremium: 'true', planId: 'lifetime' }, now), false);
});

test('AI daily limits never skip the ledger via negative unlimited', () => {
  assert.equal(clampAiDailyLimit(-1, 100), 0);
  assert.equal(clampAiDailyLimit(50_000, 100), 1_000);
  assert.equal(clampAiDailyLimit(undefined, 3), 3);
  assert.equal(clampAiDailyLimit(100, 3), 100);
});

test('malformed usage ledger counts fail closed', () => {
  assert.deepEqual(readLedgerCount(undefined, 'ai'), { used: 0, malformed: false });
  assert.deepEqual(readLedgerCount({ ai: 2 }, 'ai'), { used: 2, malformed: false });
  assert.deepEqual(readLedgerCount({ ai: '2' }, 'ai'), { used: 0, malformed: true });
  assert.deepEqual(readLedgerCount({ ai: -4 }, 'ai'), { used: 0, malformed: true });
});

test('ops config upserts drop unknown keys and clamp AI limits', () => {
  const flags = sanitizeFlagsPayload({
    aiChatEnabled: { enabled: true, percentage: 150, extra: 'drop-me' },
    notAFlag: { enabled: true },
  });
  assert.deepEqual(Object.keys(flags), ['aiChatEnabled']);
  assert.equal(flags.aiChatEnabled.percentage, 100);
  assert.equal(flags.aiChatEnabled.extra, undefined);

  const remote = sanitizeRemotePayload({
    aiDailyLimitPremium: -1,
    aiDailyLimitFree: 9,
    secretToken: 'nope',
    marketQuotePollMs: 1,
  });
  assert.equal(remote.secretToken, undefined);
  assert.equal(remote.aiDailyLimitPremium, 0);
  assert.equal(remote.aiDailyLimitFree, 9);
  assert.equal(remote.marketQuotePollMs, 5_000);

  const merged = mergeRemoteConfig({ aiDailyLimitPremium: 250, unknown: 'leak' });
  assert.equal(merged.aiDailyLimitPremium, 250);
  assert.equal(merged.unknown, undefined);
  assert.equal(typeof merged.aiModel, 'string');
});
