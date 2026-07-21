import type { SubscriptionRecord } from '../types/subscription.types';

const ACCESS_STATUSES = new Set(['active', 'cancelled', 'grace_period', 'billing_issue']);

/**
 * Access is derived from server-owned status and expiry, never from a cached `isPremium` flag.
 * A cancellation retains benefits through the paid period; expiration/refund revokes immediately.
 */
export function hasEffectivePremiumAccess(
  record: Pick<SubscriptionRecord, 'status' | 'expiresAt'> | null,
  now = Date.now(),
): boolean {
  if (!record || !ACCESS_STATUSES.has(record.status)) return false;
  if (!record.expiresAt) return record.status === 'active';

  const expiry = Date.parse(record.expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

export function withEffectiveAccess(record: SubscriptionRecord, now = Date.now()): SubscriptionRecord {
  const isPremium = hasEffectivePremiumAccess(record, now);
  return {
    ...record,
    isPremium,
    tier: isPremium ? 'premium' : 'free',
  };
}
