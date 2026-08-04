import AsyncStorage from '@react-native-async-storage/async-storage';

import { callProxy, canUseVendorProxy } from '@/shared/services/firebase/callable-proxy';
import { logger } from '@/shared/services/observability/logger';

import { createDefaultOpsBootstrap, DEFAULT_OPS_FLAGS, DEFAULT_OPS_REMOTE } from '../defaults';
import type { OpsBootstrapSnapshot, OpsFeatureFlags, OpsRemoteConfig } from '../types/ops-config.types';

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

function mergeRemote(remote?: Partial<OpsRemoteConfig> | null): OpsRemoteConfig {
  return { ...DEFAULT_OPS_REMOTE, ...(remote ?? {}) };
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
