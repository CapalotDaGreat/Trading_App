import type { AiAnalysisResult, AiEnrichedContext } from '../types/ai.types';
import { generateEngineAnalysis } from './ai-engine.service';

const CLOUD_AI_URL = process.env.EXPO_PUBLIC_AI_API_URL ?? '';

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

/** Call Firebase Function / external API when configured; else offline engine. */
export async function fetchCloudAiBrief(
  context: AiEnrichedContext,
  type: 'trade_suggestion' | 'daily_summary' = 'trade_suggestion',
): Promise<AiAnalysisResult> {
  if (!CLOUD_AI_URL) {
    return generateEngineAnalysis(type, { enriched: context, symbol: context.symbol });
  }

  try {
    const response = await fetch(`${CLOUD_AI_URL}/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, type }),
    });

    if (!response.ok) {
      throw new Error(`Cloud AI ${response.status}`);
    }

    const data = (await response.json()) as CloudAiBrief;
    return {
      type,
      content: data.summary,
      sentiment: context.overallBias ?? 'neutral',
      tradeSuggestion: {
        symbol: context.symbol ?? 'MARKET',
        action: data.action === 'skip' ? 'hold' : 'watch',
        confidence: data.confidence,
        reasoning: data.summary,
        why: data.citations.map((c) => `${c.label}: ${c.value}`),
        timeframe: 'Research window: today',
      },
      generatedAt: Date.now(),
      metadata: {
        source: 'cloud',
        confidence: data.confidence,
        dataAsOf: context.assembledAt,
        citations: data.citations.map((c) => ({ label: c.label, value: c.value })),
        symbol: context.symbol,
        modelVersion: 'tradevision-cloud-1',
      },
    };
  } catch {
    return generateEngineAnalysis(type, { enriched: context, symbol: context.symbol });
  }
}
