export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface TierLimits {
  tier: SubscriptionTier;
  label: string;
  watchlistMax: number;
  alertsMax: number;
  aiAnalysisPerDay: number;
  historicalDataDays: number;
  realtimeQuotes: boolean;
  advancedCharts: boolean;
  portfolioTracking: boolean;
  exportData: boolean;
  adFree: boolean;
  prioritySupport: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: 'free',
    label: 'Free',
    watchlistMax: 10,
    alertsMax: 3,
    aiAnalysisPerDay: 3,
    historicalDataDays: 30,
    realtimeQuotes: false,
    advancedCharts: false,
    portfolioTracking: false,
    exportData: false,
    adFree: false,
    prioritySupport: false,
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    watchlistMax: 50,
    alertsMax: 25,
    aiAnalysisPerDay: 25,
    historicalDataDays: 365,
    realtimeQuotes: true,
    advancedCharts: true,
    portfolioTracking: true,
    exportData: true,
    adFree: true,
    prioritySupport: false,
  },
  pro: {
    tier: 'pro',
    label: 'Pro',
    watchlistMax: 200,
    alertsMax: 100,
    aiAnalysisPerDay: -1,
    historicalDataDays: -1,
    realtimeQuotes: true,
    advancedCharts: true,
    portfolioTracking: true,
    exportData: true,
    adFree: true,
    prioritySupport: true,
  },
};

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'premium';

export const PREMIUM_PRODUCT_IDS = {
  monthly: 'tradevision_premium_monthly',
  yearly: 'tradevision_premium_yearly',
  lifetime: 'tradevision_premium_lifetime',
} as const;

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return SUBSCRIPTION_TIERS[tier];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof Omit<TierLimits, 'tier' | 'label'>,
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
