import { canUse } from '@/features/subscription/services/entitlement.service';
import type { EntitlementCapability } from '@/shared/constants/entitlements';
import type { SubscriptionTier } from '@/shared/constants/subscription';

/**
 * Advanced Decision OS capabilities.
 * Core learning (brief, academy basics, journal, basic radar) stays free.
 */
export type DecisionOsFeature =
  | 'advancedResearchQueue'
  | 'tradingDnaInsights'
  | 'weeklyReviews'
  | 'portfolioIntelligence'
  | 'advancedReplay'
  | 'convictionDrift'
  | 'decisionLab';

const FEATURE_CAPABILITY: Record<DecisionOsFeature, EntitlementCapability> = {
  advancedResearchQueue: 'researchWorkspace',
  tradingDnaInsights: 'tradingDna',
  weeklyReviews: 'advancedReviews',
  portfolioIntelligence: 'portfolioIntelligence',
  advancedReplay: 'advancedReplayLibrary',
  convictionDrift: 'decisionGraph',
  decisionLab: 'strategySandbox',
};

const PREMIUM_OS_FEATURES: DecisionOsFeature[] = Object.keys(
  FEATURE_CAPABILITY,
) as DecisionOsFeature[];

export function canAccessDecisionOs(tier: SubscriptionTier, feature: DecisionOsFeature): boolean {
  return canUse(FEATURE_CAPABILITY[feature], tier);
}

export function isPremiumOnlyOsFeature(feature: DecisionOsFeature): boolean {
  return PREMIUM_OS_FEATURES.includes(feature);
}

export function decisionOsUpsellCopy(feature: DecisionOsFeature): string {
  const map: Record<DecisionOsFeature, string> = {
    advancedResearchQueue:
      'See the complete ranked research queue with learning value and portfolio relevance.',
    tradingDnaInsights: 'Explore your full Trading DNA insights from memory and journals.',
    weeklyReviews: 'Continue your growth with weekly process reviews from recorded decisions.',
    portfolioIntelligence:
      'Unlock deeper insights into portfolio health, stress tests, and concentration.',
    advancedReplay: 'View your personalised coaching with advanced Process Tape insights.',
    convictionDrift:
      'See Research Value, Decision Quality, and process score evolution during replay.',
    decisionLab:
      'Included with Premium — Decision Lab challenges, advanced stats, and multi-scenario practice.',
  };
  return map[feature];
}
