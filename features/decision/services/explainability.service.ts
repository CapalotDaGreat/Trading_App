import {
  getDataFreshness,
  type DataFreshnessLevel,
} from '@/features/markets/constants/freshness';

import type { Explainability, ExplainabilityFactor } from '../types/decision.types';

export function buildExplainability(input: {
  confidence: number;
  factors: ExplainabilityFactor[];
  dataAsOf: number;
  reasoning: string;
}): Explainability {
  const agrees = input.factors.filter((f) => f.agrees).length;
  const disagrees = input.factors.length - agrees;
  const freshness: DataFreshnessLevel = getDataFreshness(input.dataAsOf);

  return {
    confidence: Math.min(95, Math.max(35, Math.round(input.confidence))),
    factors: input.factors,
    agrees,
    disagrees,
    dataAsOf: input.dataAsOf,
    freshness,
    reasoning: input.reasoning,
  };
}

export function biasFromScore(bullish: number, bearish: number): 'bullish' | 'bearish' | 'neutral' {
  if (bullish > bearish + 1) return 'bullish';
  if (bearish > bullish + 1) return 'bearish';
  return 'neutral';
}
