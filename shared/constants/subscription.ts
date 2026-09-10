import {
  FREE_ENTITLEMENTS,
  PREMIUM_ENTITLEMENTS,
  isUnlimited as entitlementIsUnlimited,
} from '@/shared/constants/entitlements';
import { YEARLY_TRIAL_DAYS as CATALOG_YEARLY_TRIAL_DAYS } from '@/shared/constants/monetization';

export type SubscriptionTier = 'free' | 'premium';

export interface TierLimits {
  tier: SubscriptionTier;
  label: string;
  description: string;
  watchlistMax: number;
  symbolsPerWatchlist: number;
  alertsMax: number;
  /**
   * Daily combined AI cap (Ask / analysis / mentor-style uses).
   * Field name kept for callers; value is per UTC day.
   */
  aiAnalysisPerDay: number;
  aiMentorMonthly: number;
  aiAnalysisMonthly: number;
  replaySessionsMonthly: number;
  portfolioPositions: number;
  portfolioTracking: boolean;
  exportData: boolean;
}

/** Warn the user when usage reaches this fraction of their daily AI cap. */
export const AI_USAGE_WARN_RATIO = 0.8;

/** Yearly plan intro trial length (configure matching offer in RevenueCat / App Store Connect). */
export const YEARLY_TRIAL_DAYS = CATALOG_YEARLY_TRIAL_DAYS;

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: 'free',
    label: 'Free',
    description: 'Learn, practise, simulate, and journal — limited replay and on-device coaching',
    watchlistMax: FREE_ENTITLEMENTS.watchlistCount as number,
    symbolsPerWatchlist: FREE_ENTITLEMENTS.symbolsPerWatchlist as number,
    alertsMax: FREE_ENTITLEMENTS.alertsMax as number,
    aiAnalysisPerDay: FREE_ENTITLEMENTS.aiDaily as number,
    aiMentorMonthly: FREE_ENTITLEMENTS.aiMentorMonthly as number,
    aiAnalysisMonthly: FREE_ENTITLEMENTS.aiAnalysisMonthly as number,
    replaySessionsMonthly: FREE_ENTITLEMENTS.replaySessionsMonthly as number,
    portfolioPositions: FREE_ENTITLEMENTS.portfolioPositions as number,
    portfolioTracking: true,
    exportData: false,
  },
  premium: {
    tier: 'premium',
    label: 'Aithera Pro',
    description:
      'Depth, personalization, and progression — full radar, DNA, Replay TV library, export',
    watchlistMax: PREMIUM_ENTITLEMENTS.watchlistCount as number,
    symbolsPerWatchlist: PREMIUM_ENTITLEMENTS.symbolsPerWatchlist as number,
    alertsMax: PREMIUM_ENTITLEMENTS.alertsMax as number,
    aiAnalysisPerDay: PREMIUM_ENTITLEMENTS.aiDaily as number,
    aiMentorMonthly: PREMIUM_ENTITLEMENTS.aiMentorMonthly as number,
    aiAnalysisMonthly: PREMIUM_ENTITLEMENTS.aiAnalysisMonthly as number,
    replaySessionsMonthly: PREMIUM_ENTITLEMENTS.replaySessionsMonthly as number,
    portfolioPositions: PREMIUM_ENTITLEMENTS.portfolioPositions as number,
    portfolioTracking: true,
    exportData: true,
  },
};

/**
 * RevenueCat entitlement identifier — must match the dashboard exactly
 * (including spaces/casing). Override with EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID.
 */
export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'Aithera Pro';

/**
 * Store product identifiers configured in App Store Connect / Play Console
 * and attached to the current RevenueCat offering.
 * Current offering: tradevision_premium_monthly, tradevision_premium_yearly, and lifetime — all attached to Aithera Pro.
 */
export const PREMIUM_PRODUCT_IDS = {
  monthly: process.env.EXPO_PUBLIC_RC_PRODUCT_MONTHLY ?? 'tradevision_premium_monthly',
  yearly: process.env.EXPO_PUBLIC_RC_PRODUCT_YEARLY ?? 'tradevision_premium_yearly',
  lifetime: process.env.EXPO_PUBLIC_RC_PRODUCT_LIFETIME ?? 'tradevision_premium_lifetime',
} as const;

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return SUBSCRIPTION_TIERS[tier];
}

export function isUnlimited(value: number): boolean {
  return entitlementIsUnlimited(value);
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof Omit<TierLimits, 'tier' | 'label' | 'description'>,
): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return isUnlimited(value) || value > 0;

  return false;
}

export function hasReachedLimit(current: number, max: number): boolean {
  if (isUnlimited(max)) return false;
  return current >= max;
}

/** True when the user has used ≥ 80% of their daily AI allowance (but not yet at the hard cap). */
export function isNearAiDailyLimit(usedToday: number, limit: number): boolean {
  if (isUnlimited(limit) || limit <= 0) return false;
  if (usedToday >= limit) return false;
  return usedToday / limit >= AI_USAGE_WARN_RATIO;
}

export function planIdFromProductId(
  productId: string | null | undefined,
): 'monthly' | 'yearly' | 'lifetime' | null {
  if (!productId) return null;
  if (productId === PREMIUM_PRODUCT_IDS.lifetime) return 'lifetime';
  if (productId === PREMIUM_PRODUCT_IDS.yearly) return 'yearly';
  if (productId === PREMIUM_PRODUCT_IDS.monthly) return 'monthly';
  if (productId.includes('lifetime')) return 'lifetime';
  if (productId.includes('yearly') || productId.includes('annual')) return 'yearly';
  if (productId.includes('monthly')) return 'monthly';
  return null;
}
