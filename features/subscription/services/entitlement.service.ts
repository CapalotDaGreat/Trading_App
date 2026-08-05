import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type EntitlementCapability,
  type EntitlementRemoteOverrides,
  type EntitlementValue,
  isUnlimited,
  resolveTierEntitlements,
  UNLIMITED,
} from '@/shared/constants/entitlements';
import type { SubscriptionTier } from '@/shared/constants/subscription';
import { useOpsConfigStore } from '@/features/ops-config/stores/ops-config.store';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function usageStorageKey(uid: string, capability: EntitlementCapability): string {
  return `tradevision:entitlement-usage:v1:${encodeURIComponent(uid)}:${capability}:${monthKey()}`;
}

export function getRemoteEntitlementOverrides(): EntitlementRemoteOverrides {
  const remote = useOpsConfigStore.getState().snapshot.remote;
  return {
    aiMentorMonthlyFree: remote.aiMentorMonthlyFree,
    aiAnalysisMonthlyFree: remote.aiAnalysisMonthlyFree ?? remote.aiDailyLimitFree,
    aiAnalysisMonthlyPremium: remote.aiAnalysisMonthlyPremium ?? remote.aiDailyLimitPremium,
    replaySessionsMonthlyFree: remote.replaySessionsMonthlyFree,
    watchlistCountFree: remote.watchlistCountFree,
    symbolsPerWatchlistFree: remote.symbolsPerWatchlistFree,
    portfolioPositionsFree: remote.portfolioPositionsFree,
    alertsMaxFree: remote.alertsMaxFree,
    researchQueueDepthFree: remote.researchQueueDepthFree,
  };
}

export function getEntitlementValue(
  capability: EntitlementCapability,
  tier?: SubscriptionTier,
): EntitlementValue {
  const resolvedTier = tier ?? useSubscriptionStore.getState().tier;
  const entitlements = resolveTierEntitlements(resolvedTier, getRemoteEntitlementOverrides());
  return entitlements[capability];
}

export function getLimit(capability: EntitlementCapability, tier?: SubscriptionTier): number {
  const value = getEntitlementValue(capability, tier);
  return typeof value === 'number' ? value : value ? UNLIMITED : 0;
}

export function canUse(capability: EntitlementCapability, tier?: SubscriptionTier): boolean {
  const value = getEntitlementValue(capability, tier);
  if (typeof value === 'boolean') return value;
  return isUnlimited(value) || value > 0;
}

export async function getMonthlyUsage(
  uid: string,
  capability: EntitlementCapability,
): Promise<number> {
  if (!uid) return 0;
  try {
    const raw = await AsyncStorage.getItem(usageStorageKey(uid, capability));
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

export async function incrementMonthlyUsage(
  uid: string,
  capability: EntitlementCapability,
  by = 1,
): Promise<number> {
  const current = await getMonthlyUsage(uid, capability);
  const next = current + by;
  await AsyncStorage.setItem(usageStorageKey(uid, capability), String(next));
  return next;
}

export async function canConsumeMonthly(
  uid: string,
  capability: EntitlementCapability,
  tier?: SubscriptionTier,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getLimit(capability, tier);
  const used = await getMonthlyUsage(uid, capability);
  if (isUnlimited(limit)) return { allowed: true, used, limit };
  return { allowed: used < limit, used, limit };
}

export const entitlementService = {
  getLimit,
  canUse,
  getMonthlyUsage,
  incrementMonthlyUsage,
  canConsumeMonthly,
  getRemoteEntitlementOverrides,
};
