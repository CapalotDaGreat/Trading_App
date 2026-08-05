import type { SubscriptionTier } from '@/shared/constants/subscription';

/** Numeric limits use -1 for unlimited. */
export const UNLIMITED = -1;

export type EntitlementCapability =
  | 'aiMentorMonthly'
  | 'aiAnalysisMonthly'
  | 'replaySessionsMonthly'
  | 'watchlistCount'
  | 'symbolsPerWatchlist'
  | 'portfolioPositions'
  | 'alertsMax'
  | 'researchQueueDepth'
  | 'tradingDna'
  | 'decisionGraph'
  | 'personalIntelligence'
  | 'advancedJournalCoach'
  | 'advancedReviews'
  | 'advancedRiskCentre'
  | 'portfolioIntelligence'
  | 'multiTimeframeConsensus'
  | 'researchWorkspace'
  | 'advancedAlerts'
  | 'cloudBackup'
  | 'priorityAi'
  | 'advancedAcademy'
  | 'advancedReplayLibrary'
  | 'decisionPassport'
  | 'processCertifications'
  | 'strategySandbox'
  | 'premiumWidgets'
  | 'prioritySupport'
  | 'fasterMarketRefresh'
  | 'journalExport';

export type EntitlementValue = number | boolean;

export type TierEntitlements = Record<EntitlementCapability, EntitlementValue>;

export const FREE_ENTITLEMENTS: TierEntitlements = {
  aiMentorMonthly: 20,
  aiAnalysisMonthly: 20,
  replaySessionsMonthly: 5,
  watchlistCount: 1,
  symbolsPerWatchlist: 15,
  portfolioPositions: 10,
  alertsMax: 5,
  researchQueueDepth: 3,
  tradingDna: false,
  decisionGraph: false,
  personalIntelligence: false,
  advancedJournalCoach: false,
  advancedReviews: false,
  advancedRiskCentre: false,
  portfolioIntelligence: false,
  multiTimeframeConsensus: false,
  researchWorkspace: false,
  advancedAlerts: false,
  cloudBackup: false,
  priorityAi: false,
  advancedAcademy: false,
  advancedReplayLibrary: false,
  decisionPassport: false,
  processCertifications: false,
  strategySandbox: false,
  premiumWidgets: false,
  prioritySupport: false,
  fasterMarketRefresh: false,
  journalExport: false,
};

export const PREMIUM_ENTITLEMENTS: TierEntitlements = {
  aiMentorMonthly: UNLIMITED,
  aiAnalysisMonthly: UNLIMITED,
  replaySessionsMonthly: UNLIMITED,
  watchlistCount: UNLIMITED,
  symbolsPerWatchlist: UNLIMITED,
  portfolioPositions: UNLIMITED,
  alertsMax: UNLIMITED,
  researchQueueDepth: UNLIMITED,
  tradingDna: true,
  decisionGraph: true,
  personalIntelligence: true,
  advancedJournalCoach: true,
  advancedReviews: true,
  advancedRiskCentre: true,
  portfolioIntelligence: true,
  multiTimeframeConsensus: true,
  researchWorkspace: true,
  advancedAlerts: true,
  cloudBackup: true,
  priorityAi: true,
  advancedAcademy: true,
  advancedReplayLibrary: true,
  decisionPassport: true,
  processCertifications: true,
  strategySandbox: true,
  premiumWidgets: true,
  prioritySupport: true,
  fasterMarketRefresh: true,
  journalExport: true,
};

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, TierEntitlements> = {
  free: FREE_ENTITLEMENTS,
  premium: PREMIUM_ENTITLEMENTS,
};

/** Remote-config overrides for numeric free-tier caps (and shared premium where useful). */
export interface EntitlementRemoteOverrides {
  aiMentorMonthlyFree?: number;
  aiAnalysisMonthlyFree?: number;
  aiAnalysisMonthlyPremium?: number;
  replaySessionsMonthlyFree?: number;
  watchlistCountFree?: number;
  symbolsPerWatchlistFree?: number;
  portfolioPositionsFree?: number;
  alertsMaxFree?: number;
  researchQueueDepthFree?: number;
}

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

export function resolveTierEntitlements(
  tier: SubscriptionTier,
  overrides?: EntitlementRemoteOverrides | null,
): TierEntitlements {
  const base = { ...TIER_ENTITLEMENTS[tier] };
  if (!overrides || tier !== 'free') {
    if (tier === 'premium' && overrides?.aiAnalysisMonthlyPremium != null) {
      base.aiAnalysisMonthly = overrides.aiAnalysisMonthlyPremium;
    }
    return base;
  }

  if (overrides.aiMentorMonthlyFree != null) base.aiMentorMonthly = overrides.aiMentorMonthlyFree;
  if (overrides.aiAnalysisMonthlyFree != null) {
    base.aiAnalysisMonthly = overrides.aiAnalysisMonthlyFree;
  }
  if (overrides.replaySessionsMonthlyFree != null) {
    base.replaySessionsMonthly = overrides.replaySessionsMonthlyFree;
  }
  if (overrides.watchlistCountFree != null) base.watchlistCount = overrides.watchlistCountFree;
  if (overrides.symbolsPerWatchlistFree != null) {
    base.symbolsPerWatchlist = overrides.symbolsPerWatchlistFree;
  }
  if (overrides.portfolioPositionsFree != null) {
    base.portfolioPositions = overrides.portfolioPositionsFree;
  }
  if (overrides.alertsMaxFree != null) base.alertsMax = overrides.alertsMaxFree;
  if (overrides.researchQueueDepthFree != null) {
    base.researchQueueDepth = overrides.researchQueueDepthFree;
  }
  return base;
}
