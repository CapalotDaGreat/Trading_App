export type SubscriptionTier = 'free' | 'premium';

export interface TierLimits {
  tier: SubscriptionTier;
  label: string;
  description: string;
  watchlistMax: number;
  alertsMax: number;
  /**
   * Hard daily AI analysis cap.
   * Premium uses a generous fair-use ceiling (not marketed as infinite compute).
   * `-1` is reserved for truly unlimited (unused while fair-use is active).
   */
  aiAnalysisPerDay: number;
  historicalDataDays: number;
  /** Faster quote refresh (polling), not exchange-tick realtime */
  realtimeQuotes: boolean;
  quoteRefreshLabel: string;
  advancedCharts: boolean;
  portfolioTracking: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  cloudAi: boolean;
}

/** Warn the user when usage reaches this fraction of their daily AI cap. */
export const AI_USAGE_WARN_RATIO = 0.8;

/** Yearly plan intro trial length (configure matching offer in RevenueCat / App Store Connect). */
export const YEARLY_TRIAL_DAYS = 7;

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierLimits> = {
  free: {
    tier: 'free',
    label: 'Free',
    description: 'Build discipline — Today brief, basic radar, journal, limited AI',
    // Generous enough for a substantive Decision Brief universe before the upsell
    watchlistMax: 25,
    alertsMax: 5,
    aiAnalysisPerDay: 3,
    historicalDataDays: 30,
    realtimeQuotes: false,
    quoteRefreshLabel: 'Delayed (~60s refresh)',
    advancedCharts: false,
    portfolioTracking: false,
    exportData: false,
    prioritySupport: false,
    cloudAi: false,
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    description:
      'Everything unlocked — full radar, trader DNA, AI coach with cloud analysis, portfolio intelligence, replay, export, and priority data',
    watchlistMax: 200,
    alertsMax: 100,
    // Fair-use ceiling — prevents unbounded cloud AI cost while staying generous
    aiAnalysisPerDay: 100,
    historicalDataDays: -1,
    realtimeQuotes: true,
    quoteRefreshLabel: 'Faster updates to delayed/last-quote data (~15–30s)',
    advancedCharts: true,
    portfolioTracking: true,
    exportData: true,
    prioritySupport: true,
    cloudAi: true,
  },
};

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'premium';

/** Active store products — monthly + yearly only (no lifetime while in early development). */
export const PREMIUM_PRODUCT_IDS = {
  monthly: 'tradevision_premium_monthly',
  yearly: 'tradevision_premium_yearly',
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

/** True when the user has used ≥ 80% of their daily AI allowance (but not yet at the hard cap). */
export function isNearAiDailyLimit(usedToday: number, limit: number): boolean {
  if (isUnlimited(limit) || limit <= 0) return false;
  if (usedToday >= limit) return false;
  return usedToday / limit >= AI_USAGE_WARN_RATIO;
}
