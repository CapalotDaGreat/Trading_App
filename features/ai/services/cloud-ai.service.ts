import { isCloudAiEnabled } from '../constants/ai-release';
import type { AiAnalysisResult, AiEnrichedContext } from '../types/ai.types';
import { generateEngineAnalysis } from './ai-engine.service';

export interface CloudAiCitation {
  label: string;
  value: string;
  sourceId?: string;
}

export interface CloudAiBrief {
  summary: string;
  action: 'research' | 'watch' | 'skip';
  confidence: number;
  citations: CloudAiCitation[];
}

/**
 * Compatibility entry point while cloud AI is deferred.
 * Never performs a client-side vendor request. When cloud AI is later enabled,
 * the only allowed path is the authenticated Functions `aiAnalysis` callable.
 */
export async function fetchCloudAiBrief(
  context: AiEnrichedContext,
  type: 'trade_suggestion' | 'daily_summary' = 'trade_suggestion',
): Promise<AiAnalysisResult> {
  if (!isCloudAiEnabled()) {
    return generateEngineAnalysis(type, { enriched: context, symbol: context.symbol });
  }
  // Cloud must go through authenticated Functions `aiAnalysis` — never a client vendor URL.
  // The callable is a fail-closed stub until an approved server model is configured.
  return generateEngineAnalysis(type, { enriched: context, symbol: context.symbol });
}
