/**
 * Launch monetization catalog for TradeInsight Premium (Aithera Pro).
 *
 * Free is a real daily product. Premium sells depth, personalization, and
 * progression — not basic Today / research / journal access.
 *
 * Store product IDs and the RevenueCat entitlement must still be created in
 * the consoles (see docs/MONETIZATION.md). Fallback prices in the paywall are
 * not production prices until StoreKit / Play Billing strings load.
 */

export type LaunchPlanId = 'monthly' | 'yearly';
export type RecognizedPlanId = LaunchPlanId | 'lifetime';

/** Entitlement identifier in RevenueCat — do not rename to a generic `premium`. */
export const LAUNCH_ENTITLEMENT_ID = 'Aithera Pro';

/** Plans offered on the paywall at launch. Lifetime is not in this set. */
export const LAUNCH_PLAN_IDS = ['monthly', 'yearly'] as const satisfies readonly LaunchPlanId[];

export const LIFETIME_OFFERED_AT_LAUNCH = false;

/** 7-day intro trial applies only to yearly, and only when the store offer is attached. */
export const YEARLY_TRIAL_DAYS = 7;

/**
 * Combined Ask / analysis / mentor-style AI uses per UTC day.
 * Premium is a fair-use cap, not unlimited.
 */
export const AI_DAILY_LIMIT_FREE = 3;
export const AI_DAILY_LIMIT_PREMIUM = 100;

/** Free Replay TV foundation rooms per calendar month. Premium removes the cap. */
export const REPLAY_TV_SESSIONS_MONTHLY_FREE = 5;

/** Free research queue stays useful (top three), not empty. */
export const RESEARCH_QUEUE_DEPTH_FREE = 3;

/** No ads in this launch. A future free-tier ad surface would need a privacy/legal pass. */
export const ADS_IN_FREE_TIER_AT_LAUNCH = false;

export function isLaunchPlanId(id: string): id is LaunchPlanId {
  return (LAUNCH_PLAN_IDS as readonly string[]).includes(id);
}

export interface FeatureComparisonRow {
  feature: string;
  free: string;
  premium: string;
}

/**
 * User-facing Free vs Premium matrix. Keep paywall and store copy aligned with this.
 * Depth/personalization/progression — never buy/sell signals or investment advice.
 */
export const LAUNCH_FEATURE_COMPARISON: readonly FeatureComparisonRow[] = [
  { feature: 'Today', free: 'Included', premium: 'Included' },
  { feature: 'Basic research', free: 'Included', premium: 'Included' },
  { feature: 'Basic journal', free: 'Included', premium: 'Included' },
  { feature: 'Replay', free: 'Limited', premium: 'Full' },
  { feature: 'AI', free: `${AI_DAILY_LIMIT_FREE}/day`, premium: `~${AI_DAILY_LIMIT_PREMIUM}/day fair use` },
  { feature: 'Radar', free: 'Limited', premium: 'Full' },
  { feature: 'Trading DNA', free: 'Basic', premium: 'Full' },
  { feature: 'Personal Intelligence', free: 'Limited', premium: 'Full' },
  { feature: 'Decision Replay TV', free: 'Limited episodes', premium: 'Full library' },
  { feature: 'Advanced risk', free: 'Limited', premium: 'Included' },
  { feature: 'Advanced alerts', free: 'Limited', premium: 'Included' },
  { feature: 'Portfolio intelligence', free: '—', premium: 'Included' },
  { feature: 'Export', free: '—', premium: 'Included' },
  { feature: 'Ads', free: 'None at launch', premium: 'None' },
  { feature: '7-day trial', free: '—', premium: 'Yearly only' },
];
