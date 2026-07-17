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
  | 'decisionTimeline'
  | 'convictionDrift'
  | 'enhancedExplainability'
  | 'priorityCloudAi'
  | 'decisionLab';

const PREMIUM_OS_FEATURES: DecisionOsFeature[] = [
  'advancedResearchQueue',
  'tradingDnaInsights',
  'weeklyReviews',
  'portfolioIntelligence',
  'advancedReplay',
  'decisionTimeline',
  'convictionDrift',
  'enhancedExplainability',
  'priorityCloudAi',
  'decisionLab',
];

export function canAccessDecisionOs(
  tier: SubscriptionTier,
  _feature: DecisionOsFeature,
): boolean {
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
    weeklyReviews: 'Unlock Sunday/weekly AI-style process reviews.',
    portfolioIntelligence:
      'Unlock portfolio health, stress tests, and concentration intelligence.',
    advancedReplay:
      'Unlock Decision Replay AI coach, learning insights, and graded process comparisons.',
    decisionTimeline: 'Unlock full setup decision timelines in the Decision Log.',
    convictionDrift:
      'Unlock Research Value, Decision Quality, and process score evolution during replay.',
    enhancedExplainability: 'Unlock counterfactuals and deeper source reasoning.',
    priorityCloudAi: 'Unlock priority cloud AI with your Decision Intelligence Context.',
    decisionLab:
      'Unlock Decision Lab challenges, advanced stats, and multi-scenario paper practice.',
  };
  return map[feature];
}
