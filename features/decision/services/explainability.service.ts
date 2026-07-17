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

/** Counterfactual hints for explainability v2 — what would flip the view. */
export function buildCounterfactuals(input: {
  confidence: number;
  factors: ExplainabilityFactor[];
  rsiSignal?: string;
  mtfMismatch?: string;
}): { label: string; detail: string }[] {
  const out: { label: string; detail: string }[] = [];

  const disagreeing = input.factors.filter((f) => !f.agrees);
  if (disagreeing.length) {
    out.push({
      label: 'If factors aligned',
      detail: `Confidence could rise ~${Math.min(15, disagreeing.length * 5)}% if ${disagreeing[0]?.label.toLowerCase()} agreed.`,
    });
  }

  if (input.rsiSignal === 'overbought' || input.rsiSignal === 'oversold') {
    out.push({
      label: 'If RSI were neutral',
      detail: `Confidence −${Math.min(12, Math.round(input.confidence * 0.12))}% — extreme RSI adds reversal risk.`,
    });
  }

  if (input.mtfMismatch) {
    out.push({
      label: 'Timeframe conflict',
      detail: input.mtfMismatch,
    });
  }

  return out.slice(0, 3);
}
