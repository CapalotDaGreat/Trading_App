import type {
  OpsBootstrapSnapshot,
  OpsFeatureFlags,
  OpsRemoteConfig,
} from './types/ops-config.types';

export type { OpsFeatureFlags };

const flag = (
  key: string,
  kind: OpsFeatureFlags[keyof OpsFeatureFlags]['kind'],
  enabled: boolean,
  percentage = 100,
  description?: string,
): OpsFeatureFlags[keyof OpsFeatureFlags] => ({
  key,
  kind,
  enabled,
  percentage,
  description,
});

export const DEFAULT_OPS_FLAGS: OpsFeatureFlags = {
  globalKill: flag(
    'globalKill',
    'kill',
    false,
    100,
    'Emergency kill — disables high-risk surfaces while keeping Today/guest usable',
  ),
  aiChatEnabled: flag('aiChatEnabled', 'boolean', true, 100, 'Ask AI chat'),
  aiTrustPanelsEnabled: flag('aiTrustPanelsEnabled', 'boolean', true, 100),
  personalIntelligenceEnabled: flag('personalIntelligenceEnabled', 'boolean', true, 100),
  decisionGraphEnabled: flag('decisionGraphEnabled', 'boolean', true, 100),
  mentorEnabled: flag('mentorEnabled', 'boolean', true, 100),
  academyEnabled: flag('academyEnabled', 'boolean', true, 100),
  paywallExperimentsEnabled: flag('paywallExperimentsEnabled', 'percentage', false, 0),
  aggressiveMarketPollingEnabled: flag('aggressiveMarketPollingEnabled', 'boolean', false, 100),
  betaReplayStudioEnabled: flag('betaReplayStudioEnabled', 'beta', false, 100),
  internalDiagnosticsEnabled: flag('internalDiagnosticsEnabled', 'internal', false, 100),
};

export const DEFAULT_OPS_REMOTE: OpsRemoteConfig = {
  schemaVersion: 1,
  aiModel: 'tradevision-engine-2.0',
  aiDailyLimitFree: 20,
  aiDailyLimitPremium: -1,
  aiMentorMonthlyFree: 20,
  aiAnalysisMonthlyFree: 20,
  aiAnalysisMonthlyPremium: -1,
  replaySessionsMonthlyFree: 5,
  watchlistCountFree: 1,
  symbolsPerWatchlistFree: 15,
  portfolioPositionsFree: 10,
  alertsMaxFree: 5,
  researchQueueDepthFree: 3,
  marketQuotePollMs: 45_000,
  marketCandlePollMs: 120_000,
  alertEvalIntervalMs: 45_000,
  academyContentEnabled: true,
  mentorWeeklyChallengeEnabled: true,
  decisionBriefMaxSetups: 5,
  decisionBriefMinRvs: 40,
  notificationQuietHoursStart: 22,
  notificationQuietHoursEnd: 7,
  marketRefreshAggressiveness: 'balanced',
  storePromoMessage:
    'Continue your growth with deeper DNA, Decision Graph, and unlimited mentor coaching — educational process tools only.',
  storePromoEnabled: false,
  analyticsSampleRate: 1,
  perfSampleRate: 0.2,
  sentryTracesSampleRate: 0.05,
  spikeAlertSecurityEventsPerHour: 200,
  backupRetentionDays: 30,
};

export const OPS_CONFIG_SCHEMA_VERSION = 1;

export function createDefaultOpsBootstrap(): OpsBootstrapSnapshot {
  return {
    schemaVersion: OPS_CONFIG_SCHEMA_VERSION,
    etag: 'defaults',
    updatedAt: 0,
    flags: JSON.parse(JSON.stringify(DEFAULT_OPS_FLAGS)) as OpsFeatureFlags,
    remote: { ...DEFAULT_OPS_REMOTE },
    source: 'defaults',
  };
}
