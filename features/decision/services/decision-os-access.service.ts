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

const PREMIUM_OS_FEATURES: DecisionOsFeature[] = [
  'advancedResearchQueue',
  'tradingDnaInsights',
  'weeklyReviews',
  'portfolioIntelligence',
  'advancedReplay',
  'convictionDrift',
  'decisionLab',
];

export function canAccessDecisionOs(tier: SubscriptionTier, _feature: DecisionOsFeature): boolean {
  return tier === 'premium';
}

export function isPremiumOnlyOsFeature(feature: DecisionOsFeature): boolean {
  return PREMIUM_OS_FEATURES.includes(feature);
}

export function decisionOsUpsellCopy(feature: DecisionOsFeature): string {
  const map: Record<DecisionOsFeature, string> = {
    advancedResearchQueue:
      'Unlock ranked research queues with learning value and portfolio relevance.',
    tradingDnaInsights: 'Unlock full Trading DNA insights from your memory and journals.',
    weeklyReviews: 'Unlock weekly process reviews built from your recorded decisions.',
    portfolioIntelligence: 'Unlock portfolio health, stress tests, and concentration intelligence.',
    advancedReplay: 'Unlock advanced Process Tape insights and graded process comparisons.',
    convictionDrift:
      'Unlock Research Value, Decision Quality, and process score evolution during replay.',
    decisionLab:
      'Unlock Decision Lab challenges, advanced stats, and multi-scenario paper practice.',
  };
  return map[feature];
}
