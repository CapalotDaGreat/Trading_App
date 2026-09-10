export type FeatureFlagKind =
  | 'kill'
  | 'boolean'
  | 'percentage'
  | 'premium'
  | 'beta'
  | 'internal';

export type BuildChannel =
  | 'development'
  | 'preview'
  | 'internal'
  | 'beta'
  | 'production'
  | 'unknown';

export interface FeatureFlagDefinition {
  key: string;
  kind: FeatureFlagKind;
  /** Master enabled bit before targeting. */
  enabled: boolean;
  /** 0–100 for percentage rollouts. */
  percentage?: number;
  description?: string;
}

export interface OpsRemoteConfig {
  schemaVersion: number;
  aiModel: string;
  /** Daily combined AI cap for free (Ask / analysis / mentor). */
  aiDailyLimitFree: number;
  /** Daily combined AI fair-use cap for Premium. */
  aiDailyLimitPremium: number;
  /** @deprecated Prefer aiDailyLimitFree — kept so older remote docs still parse. */
  aiMentorMonthlyFree: number;
  /** @deprecated Prefer aiDailyLimitFree. */
  aiAnalysisMonthlyFree: number;
  /** @deprecated Prefer aiDailyLimitPremium. */
  aiAnalysisMonthlyPremium: number;
  replaySessionsMonthlyFree: number;
  watchlistCountFree: number;
  symbolsPerWatchlistFree: number;
  portfolioPositionsFree: number;
  alertsMaxFree: number;
  researchQueueDepthFree: number;
  marketQuotePollMs: number;
  marketCandlePollMs: number;
  alertEvalIntervalMs: number;
  academyContentEnabled: boolean;
  mentorWeeklyChallengeEnabled: boolean;
  decisionBriefMaxSetups: number;
  decisionBriefMinRvs: number;
  notificationQuietHoursStart: number;
  notificationQuietHoursEnd: number;
  marketRefreshAggressiveness: 'conservative' | 'balanced' | 'aggressive';
  storePromoMessage: string;
  storePromoEnabled: boolean;
  analyticsSampleRate: number;
  perfSampleRate: number;
  sentryTracesSampleRate: number;
  spikeAlertSecurityEventsPerHour: number;
  backupRetentionDays: number;
}

export interface OpsFeatureFlags {
  globalKill: FeatureFlagDefinition;
  aiChatEnabled: FeatureFlagDefinition;
  personalIntelligenceEnabled: FeatureFlagDefinition;
  mentorEnabled: FeatureFlagDefinition;
  academyEnabled: FeatureFlagDefinition;
  decisionReinforcementEnabled: FeatureFlagDefinition;
  aggressiveMarketPollingEnabled: FeatureFlagDefinition;
}

export interface OpsBootstrapSnapshot {
  schemaVersion: number;
  etag: string;
  updatedAt: number;
  flags: OpsFeatureFlags;
  remote: OpsRemoteConfig;
  source: 'defaults' | 'remote' | 'cache';
}

export interface FlagEvaluationContext {
  uid?: string | null;
  isPremium?: boolean;
  channel?: BuildChannel;
  nowMs?: number;
}
