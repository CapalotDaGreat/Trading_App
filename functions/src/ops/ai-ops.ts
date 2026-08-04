import { recordDailyCounter } from './aggregates';

export interface AiOpsMeta {
  ok: boolean;
  latencyMs: number;
  model?: string;
  category?: string;
  fallback?: boolean;
  estTokens?: number;
  /** Micro-dollars estimate — never tied to user billing. */
  estCostMicros?: number;
}

/** Metadata-only AI ops rollup — never stores prompts or completions. */
export async function recordAiOps(meta: AiOpsMeta): Promise<void> {
  const fields: Record<string, number> = {
    requests: 1,
    latencyMsSum: Math.max(0, Math.min(meta.latencyMs, 120_000)),
  };
  if (!meta.ok) fields.failures = 1;
  if (meta.fallback) fields.fallbackCount = 1;
  if (typeof meta.estTokens === 'number') {
    fields.estTokensSum = Math.max(0, Math.min(meta.estTokens, 200_000));
  }
  if (typeof meta.estCostMicros === 'number') {
    fields.estCostMicrosSum = Math.max(0, Math.min(meta.estCostMicros, 1_000_000_000));
  }
  if (meta.model) {
    const safe = meta.model.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
    if (safe) fields[`model_${safe}`] = 1;
  }
  if (meta.category) {
    const safe = meta.category.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
    if (safe) fields[`cat_${safe}`] = 1;
  }
  await recordDailyCounter('ai', fields);
}
