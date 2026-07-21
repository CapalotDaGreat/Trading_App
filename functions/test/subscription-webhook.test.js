const assert = require('node:assert/strict');
const test = require('node:test');

const {
  accountDeletionPaths,
  hasRecentLogin,
  isValidWebhookAuthorization,
  mapRevenueCatEvent,
} = require('../lib/index.js');

const baseEvent = {
  id: 'event-1',
  app_user_id: 'firebase-uid',
  product_id: 'tradevision_premium_yearly',
  entitlement_ids: ['premium'],
  store: 'PLAY_STORE',
  event_timestamp_ms: Date.parse('2026-07-21T12:00:00.000Z'),
  purchased_at_ms: Date.parse('2026-07-01T12:00:00.000Z'),
  expiration_at_ms: Date.parse('2027-07-01T12:00:00.000Z'),
};

test('maps purchase, cancellation, expiration, refund, grace, and product change', () => {
  assert.equal(mapRevenueCatEvent({ ...baseEvent, type: 'INITIAL_PURCHASE' }).status, 'active');

  const cancellation = mapRevenueCatEvent({ ...baseEvent, type: 'CANCELLATION' });
  assert.equal(cancellation.status, 'cancelled');
  assert.equal(cancellation.willRenew, false);
  assert.equal(cancellation.tier, 'premium');

  assert.equal(mapRevenueCatEvent({ ...baseEvent, type: 'EXPIRATION' }).tier, 'free');
  assert.equal(mapRevenueCatEvent({ ...baseEvent, type: 'REFUND' }).status, 'refunded');

  const grace = mapRevenueCatEvent({
    ...baseEvent,
    type: 'BILLING_ISSUE',
    grace_period_expiration_at_ms: Date.parse('2026-07-28T12:00:00.000Z'),
  });
  assert.equal(grace.status, 'grace_period');

  const changed = mapRevenueCatEvent({
    ...baseEvent,
    type: 'PRODUCT_CHANGE',
    new_product_id: 'tradevision_premium_monthly',
  });
  assert.equal(changed.planId, 'monthly');
});

test('verifies exact raw or bearer webhook authorization', () => {
  assert.equal(isValidWebhookAuthorization('webhook-secret', 'webhook-secret'), true);
  assert.equal(isValidWebhookAuthorization('Bearer webhook-secret', 'webhook-secret'), true);
  assert.equal(isValidWebhookAuthorization('wrong-secret', 'webhook-secret'), false);
  assert.equal(isValidWebhookAuthorization(undefined, 'webhook-secret'), false);
});

test('requires an authenticated session no older than five minutes for deletion', () => {
  const now = 2_000_000_000;
  assert.equal(hasRecentLogin(now, now), true);
  assert.equal(hasRecentLogin(now - 300, now), true);
  assert.equal(hasRecentLogin(now - 301, now), false);
  assert.equal(hasRecentLogin(now + 1, now), false);
  assert.equal(hasRecentLogin(undefined, now), false);
});

test('scopes account deletion to the authenticated uid', () => {
  assert.deepEqual(accountDeletionPaths('firebase-uid'), {
    userDocument: 'users/firebase-uid',
    userSettingsDocument: 'userSettings/firebase-uid',
    subscriptionDocument: 'subscriptions/firebase-uid',
    storagePrefix: 'users/firebase-uid/',
  });
});
