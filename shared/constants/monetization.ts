/**
 * Launch monetization catalog for TradeAcademy Premium (Aithera Pro).
 *
 * Free is a real daily product. Premium sells depth, personalization, and
 * progression — not basic Learn / Practice / Journal access.
 *
 * Store product IDs and the RevenueCat entitlement must still be created in
 * the consoles (see docs/MONETIZATION.md). Fallback prices in the paywall are
 * not production prices until StoreKit / Play Billing strings load.
 */

export type LaunchPlanId = 'monthly' | 'yearly' | 'lifetime';
export type RecognizedPlanId = LaunchPlanId;

/** Entitlement identifier in RevenueCat — do not rename to a generic `premium`. */
export const LAUNCH_ENTITLEMENT_ID = 'Aithera Pro';

/** Plans offered on the paywall. Store prices win once the current offering loads. */
export const LAUNCH_PLAN_IDS = ['monthly', 'yearly', 'lifetime'] as const satisfies readonly LaunchPlanId[];

export const LIFETIME_OFFERED_AT_LAUNCH = true;

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
  { feature: 'Home', free: 'Included', premium: 'Included' },
  { feature: 'Introductory Academy', free: 'Included', premium: 'Full catalog' },
  { feature: 'Practice drills', free: 'Selected', premium: 'Full' },
  { feature: 'Simulation', free: 'Limited', premium: 'Challenges + history depth' },
  { feature: 'Market events', free: 'Included', premium: 'Included' },
  { feature: 'Training plans', free: 'Basic loop', premium: 'Personalized weekly plan' },
  { feature: 'Basic journal', free: 'Included', premium: 'Included' },
  { feature: 'Replay', free: 'Limited', premium: 'Full' },
  { feature: 'AI', free: `${AI_DAILY_LIMIT_FREE}/day`, premium: `~${AI_DAILY_LIMIT_PREMIUM}/day fair use` },
  { feature: 'Process patterns', free: 'Basic', premium: 'Full' },
  { feature: 'Personal Intelligence', free: 'Limited', premium: 'Full' },
  { feature: 'Decision Replay TV', free: 'Limited episodes', premium: 'Full library' },
  { feature: 'Advanced review', free: 'Limited', premium: 'Included' },
  { feature: 'Export', free: '—', premium: 'Included' },
  { feature: 'Ads', free: 'None at launch', premium: 'None' },
  { feature: '7-day trial', free: '—', premium: 'Yearly only' },
];
