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
 * It deliberately never performs a network request in this release.
 */
export async function fetchCloudAiBrief(
  context: AiEnrichedContext,
  type: 'trade_suggestion' | 'daily_summary' = 'trade_suggestion',
): Promise<AiAnalysisResult> {
  return generateEngineAnalysis(type, { enriched: context, symbol: context.symbol });
}
