import { getDataFreshness } from '@/features/markets/constants/freshness';
import { LOCAL_ANALYSIS_LABEL } from '@/features/ai/constants/ai-release';
import { NON_PREDICTION_COPY } from '@/shared/constants/trust-language';

import type { AiAnalysisMetadata, AiEnrichedContext, AiSentiment } from '../types/ai.types';
import type { AiTrustPayload } from '../types/ai-trust.types';
import {
  getAiConfidenceHistory,
  getAiWhyChanged,
  recordAiRecommendationSnapshot,
} from './ai-change-history.service';
import { buildAiCounterfactuals } from './ai-counterfactual.service';
import { buildConfidenceBreakdown } from './ai-confidence.service';
import { buildEvidencePack } from './ai-evidence.service';
import { buildAiTrustBriefing } from './ai-trust-briefing.service';

export function buildAiTrustPayload(
  context: AiEnrichedContext,
  input?: {
    sentiment?: AiSentiment;
    action?: 'research' | 'watch' | 'skip';
    citations?: AiAnalysisMetadata['citations'];
    whyChanged?: AiTrustPayload['whyChanged'];
    confidenceHistory?: AiTrustPayload['confidenceHistory'];
  },
): AiTrustPayload {
  const confidence = buildConfidenceBreakdown(context);
  const evidence = buildEvidencePack(context, input?.sentiment);
  const counterfactuals = buildAiCounterfactuals(context, confidence);
  const freshness = getDataFreshness(context.assembledAt);
  const citations = input?.citations ?? [];
  const indicatorCitations = citations.filter((c) =>
    /rsi|macd|adx|atr|trend|volume|support|resistance|sma|ema/i.test(c.label),
  );

  const briefing = buildAiTrustBriefing({
    context,
    confidence,
    evidence,
    counterfactuals,
    freshness,
  });

  return {
    confidence,
    evidence,
    counterfactuals,
    briefing,
    whyChanged: input?.whyChanged ?? null,
    confidenceHistory: input?.confidenceHistory,
    meta: {
      dataAsOf: context.assembledAt,
      freshness,
      providerLabel: LOCAL_ANALYSIS_LABEL,
      source: 'engine',
      dataKind: freshness === 'stale' || freshness === 'unknown' ? 'approximate' : 'delayed',
      citations,
      indicatorCitations,
      educationalReminder: NON_PREDICTION_COPY,
    },
  };
}

/**
 * Persist a recommendation snapshot and attach why-changed + confidence history.
 */
export async function attachWhyChanged(
  context: AiEnrichedContext,
  trust: AiTrustPayload,
  action?: 'research' | 'watch' | 'skip',
): Promise<AiTrustPayload> {
  const symbol = context.symbol;
  if (!symbol) return trust;

  const whyChanged = await recordAiRecommendationSnapshot({
    symbol,
    at: Date.now(),
    action,
    overallConfidence: trust.confidence.overall,
    bias: context.overallBias,
    regimeLabel: context.decisionIntelligence?.regimeLabel,
    rsi: context.rsi?.value,
    adx: context.adx,
    newsCount: context.newsHeadlines?.length ?? 0,
    note: trust.evidence.observation.slice(0, 160),
  });

  const confidenceHistory = await getAiConfidenceHistory(symbol);
  return {
    ...trust,
    whyChanged: whyChanged ?? (await getAiWhyChanged(symbol)),
    confidenceHistory,
  };
}
