import AsyncStorage from '@react-native-async-storage/async-storage';

import { callProxy, canUseVendorProxy } from '@/shared/services/firebase/callable-proxy';
import { logger } from '@/shared/services/observability/logger';

import { createDefaultOpsBootstrap, DEFAULT_OPS_FLAGS, DEFAULT_OPS_REMOTE } from '../defaults';
import type {
  OpsBootstrapSnapshot,
  OpsFeatureFlags,
  OpsRemoteConfig,
} from '../types/ops-config.types';

const CACHE_KEY = 'tradevision-ops-bootstrap-v1';

function mergeFlags(remote?: Partial<OpsFeatureFlags> | null): OpsFeatureFlags {
  const base = JSON.parse(JSON.stringify(DEFAULT_OPS_FLAGS)) as OpsFeatureFlags;
  if (!remote) return base;
  for (const key of Object.keys(base) as (keyof OpsFeatureFlags)[]) {
    const patch = remote[key];
    if (patch && typeof patch === 'object') {
      base[key] = { ...base[key], ...patch, key: base[key].key, kind: base[key].kind };
    }
  }
  return base;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

function mergeRemote(remote?: Partial<OpsRemoteConfig> | null): OpsRemoteConfig {
  const merged = { ...DEFAULT_OPS_REMOTE, ...(remote ?? {}) };
  return {
    ...merged,
    aiMentorMonthlyFree: boundedNumber(
      remote?.aiMentorMonthlyFree,
      DEFAULT_OPS_REMOTE.aiMentorMonthlyFree,
      0,
      10_000,
    ),
    aiAnalysisMonthlyFree: boundedNumber(
      remote?.aiAnalysisMonthlyFree,
      DEFAULT_OPS_REMOTE.aiAnalysisMonthlyFree,
      0,
      10_000,
    ),
    aiAnalysisMonthlyPremium: boundedNumber(
      remote?.aiAnalysisMonthlyPremium,
      DEFAULT_OPS_REMOTE.aiAnalysisMonthlyPremium,
      -1,
      100_000,
    ),
    replaySessionsMonthlyFree: boundedNumber(
      remote?.replaySessionsMonthlyFree,
      DEFAULT_OPS_REMOTE.replaySessionsMonthlyFree,
      0,
      10_000,
    ),
    watchlistCountFree: boundedNumber(
      remote?.watchlistCountFree,
      DEFAULT_OPS_REMOTE.watchlistCountFree,
      0,
      100,
    ),
    symbolsPerWatchlistFree: boundedNumber(
      remote?.symbolsPerWatchlistFree,
      DEFAULT_OPS_REMOTE.symbolsPerWatchlistFree,
      0,
      1_000,
    ),
    portfolioPositionsFree: boundedNumber(
      remote?.portfolioPositionsFree,
      DEFAULT_OPS_REMOTE.portfolioPositionsFree,
      0,
      10_000,
    ),
    alertsMaxFree: boundedNumber(remote?.alertsMaxFree, DEFAULT_OPS_REMOTE.alertsMaxFree, 0, 1_000),
    researchQueueDepthFree: boundedNumber(
      remote?.researchQueueDepthFree,
      DEFAULT_OPS_REMOTE.researchQueueDepthFree,
      0,
      100,
    ),
    marketQuotePollMs: boundedNumber(
      remote?.marketQuotePollMs,
      DEFAULT_OPS_REMOTE.marketQuotePollMs,
      10_000,
      5 * 60_000,
    ),
    marketCandlePollMs: boundedNumber(
      remote?.marketCandlePollMs,
      DEFAULT_OPS_REMOTE.marketCandlePollMs,
      30_000,
      10 * 60_000,
    ),
    alertEvalIntervalMs: boundedNumber(
      remote?.alertEvalIntervalMs,
      DEFAULT_OPS_REMOTE.alertEvalIntervalMs,
      15_000,
      15 * 60_000,
    ),
    decisionBriefMaxSetups: boundedNumber(
      remote?.decisionBriefMaxSetups,
      DEFAULT_OPS_REMOTE.decisionBriefMaxSetups,
      0,
      10,
    ),
  };
}

export function normalizeOpsBootstrap(raw: unknown): OpsBootstrapSnapshot {
  const defaults = createDefaultOpsBootstrap();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = raw as Partial<OpsBootstrapSnapshot>;
  return {
    schemaVersion: data.schemaVersion ?? defaults.schemaVersion,
    etag: typeof data.etag === 'string' ? data.etag : defaults.etag,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    flags: mergeFlags(data.flags),
    remote: mergeRemote(data.remote),
    source: data.source === 'remote' || data.source === 'cache' ? data.source : 'remote',
  };
}

export async function loadCachedOpsBootstrap(): Promise<OpsBootstrapSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return { ...normalizeOpsBootstrap(JSON.parse(raw)), source: 'cache' };
  } catch {
    return null;
  }
}

export async function saveCachedOpsBootstrap(snapshot: OpsBootstrapSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    logger.warn('ops_config.cache_write_failed', { error });
  }
}

/**
 * Fetch remote ops bootstrap. Falls back to cache, then hard-coded defaults.
 * Guest/demo never requires network for safe behaviour.
 */
export async function fetchOpsBootstrap(): Promise<OpsBootstrapSnapshot> {
  const cached = await loadCachedOpsBootstrap();

  if (!canUseVendorProxy()) {
    return cached ?? createDefaultOpsBootstrap();
  }

  try {
    const data = await callProxy<Record<string, never>, unknown>('getOpsBootstrap', {});
    const snapshot = normalizeOpsBootstrap({ ...(data as object), source: 'remote' });
    await saveCachedOpsBootstrap(snapshot);
    return snapshot;
  } catch (error) {
    logger.warn('ops_config.fetch_failed', { error });
    return cached ?? createDefaultOpsBootstrap();
  }
}
