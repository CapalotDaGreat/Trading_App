/**
 * Cloud AI is intentionally deferred for this release.
 * Keep this false until privacy, provenance, reliability, and a server-owned proxy are approved.
 * `EXPO_PUBLIC_AI_*` / vendor keys in the client must never enable cloud AI.
 */
export const CLOUD_AI_ENABLED = false as const;

export function isCloudAiEnabled(): boolean {
  return CLOUD_AI_ENABLED;
}

export const LOCAL_ANALYSIS_LABEL = 'Local rules-based analysis';
