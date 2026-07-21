/**
 * Cloud AI is intentionally deferred for this release.
 * Keep this false until privacy, provenance, reliability, and backend ownership are approved.
 */
export const CLOUD_AI_ENABLED = false as const;

export function isCloudAiEnabled(): boolean {
  return CLOUD_AI_ENABLED;
}

export const LOCAL_ANALYSIS_LABEL = 'Local rules-based analysis';
