import type {
  BuildChannel,
  FeatureFlagDefinition,
  FlagEvaluationContext,
  OpsFeatureFlags,
} from '../types/ops-config.types';

/** Stable 0–99 bucket from uid for percentage rollouts. */
export function uidBucket(uid: string, salt = 'tv-flag'): number {
  let hash = 0;
  const input = `${salt}:${uid}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

export function evaluateFlag(
  definition: FeatureFlagDefinition,
  context: FlagEvaluationContext = {},
  globalKillEnabled = false,
): boolean {
  if (definition.kind === 'kill') {
    return Boolean(definition.enabled);
  }

  // Emergency kill disables non-essential surfaces.
  if (globalKillEnabled && definition.key !== 'globalKill') {
    const killSafe = new Set([
      'mentorEnabled',
      'academyEnabled',
      // core loop stays available via defaults; high-risk flags off
    ]);
    if (!killSafe.has(definition.key)) {
      if (
        definition.key === 'aiChatEnabled' ||
        definition.key === 'paywallExperimentsEnabled' ||
        definition.key === 'aggressiveMarketPollingEnabled' ||
        definition.key === 'betaReplayStudioEnabled' ||
        definition.key === 'internalDiagnosticsEnabled'
      ) {
        return false;
      }
    }
  }

  if (!definition.enabled) return false;

  if (definition.kind === 'premium' && !context.isPremium) return false;

  if (definition.kind === 'beta') {
    const channel = context.channel ?? 'unknown';
    if (channel !== 'beta' && channel !== 'internal' && channel !== 'development') return false;
  }

  if (definition.kind === 'internal') {
    const channel = context.channel ?? 'unknown';
    if (channel !== 'internal' && channel !== 'development') return false;
  }

  if (definition.kind === 'percentage' || definition.percentage != null) {
    const pct = definition.percentage ?? 100;
    if (pct >= 100) return true;
    if (pct <= 0) return false;
    const uid = context.uid ?? 'anonymous';
    return uidBucket(uid, definition.key) < pct;
  }

  return true;
}

export function evaluateAllFlags(
  flags: OpsFeatureFlags,
  context: FlagEvaluationContext = {},
): Record<keyof OpsFeatureFlags, boolean> {
  const kill = evaluateFlag(flags.globalKill, context, false);
  const keys = Object.keys(flags) as (keyof OpsFeatureFlags)[];
  const result = {} as Record<keyof OpsFeatureFlags, boolean>;
  for (const key of keys) {
    result[key] = evaluateFlag(flags[key], context, kill);
  }
  result.globalKill = kill;
  return result;
}

export function resolveBuildChannel(raw?: string | null): BuildChannel {
  const value = (raw ?? '').toLowerCase();
  if (
    value === 'development' ||
    value === 'preview' ||
    value === 'internal' ||
    value === 'beta' ||
    value === 'production'
  ) {
    return value;
  }
  return 'unknown';
}
