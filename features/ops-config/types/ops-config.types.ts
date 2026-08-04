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
  aiDailyLimitFree: number;
  aiDailyLimitPremium: number;
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
  aiTrustPanelsEnabled: FeatureFlagDefinition;
  personalIntelligenceEnabled: FeatureFlagDefinition;
  decisionGraphEnabled: FeatureFlagDefinition;
  mentorEnabled: FeatureFlagDefinition;
  academyEnabled: FeatureFlagDefinition;
  paywallExperimentsEnabled: FeatureFlagDefinition;
  aggressiveMarketPollingEnabled: FeatureFlagDefinition;
  betaReplayStudioEnabled: FeatureFlagDefinition;
  internalDiagnosticsEnabled: FeatureFlagDefinition;
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
