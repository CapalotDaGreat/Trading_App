import { getDataFreshness } from '@/features/markets/constants/freshness';
import { NON_PREDICTION_COPY, TRUST_LANGUAGE } from '@/shared/constants/trust-language';

import type { AiEnrichedContext } from '../types/ai.types';
import type {
  ConfidenceBreakdown,
  ConfidencePillar,
  ConfidencePillarId,
} from '../types/ai-trust.types';

function clamp(n: number, min = 35, max = 95): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function pillar(
  id: ConfidencePillarId,
  label: string,
  score: number,
  explanation: string,
  agrees: boolean,
): ConfidencePillar {
  return { id, label, score: clamp(score), explanation, agrees };
}

/**
 * Multi-pillar evidence-quality breakdown from enriched market context.
 * Scores describe coverage / consistency — never P(price up).
 */
export function buildConfidenceBreakdown(context: AiEnrichedContext): ConfidenceBreakdown {
  const freshness = getDataFreshness(context.assembledAt);
  const freshnessScore =
    freshness === 'live' ? 96 : freshness === 'recent' ? 82 : freshness === 'stale' ? 55 : 48;

  const trendScore = (() => {
    if (!context.trend) return 50;
    if (context.overallBias === 'neutral') return 58;
    const base = context.biasConfidence ?? 70;
    return context.trend.includes('strong') ? base + 8 : base;
  })();

  const rsi = context.rsi?.value;
  const momentumScore = (() => {
    if (rsi == null) return 52;
    if (rsi >= 45 && rsi <= 65) return 88;
    if (rsi > 70 || rsi < 30) return 62;
    return 78;
  })();

  const volumeScore = (() => {
    const vol = context.quote?.volume;
    if (vol == null || vol <= 0) return 60;
    return vol > 1_000_000 ? 90 : vol > 200_000 ? 78 : 68;
  })();

  const atr = context.atr;
  const price = context.quote?.price ?? 0;
  const volatilityScore = (() => {
    if (!atr || !price) return 65;
    const pct = (atr / price) * 100;
    if (pct < 1.2) return 86;
    if (pct < 2.5) return 74;
    return 58;
  })();

  const fg = context.fearGreedIndex;
  const macroScore = (() => {
    if (fg == null) return 62;
    if (fg >= 40 && fg <= 60) return 78;
    if (fg > 75 || fg < 25) return 55;
    return 70;
  })();

  const newsCount = context.newsHeadlines?.length ?? 0;
  const newsScore = newsCount >= 3 ? 78 : newsCount >= 1 ? 68 : 55;

  const adx = context.adx;
  const breadthScore = (() => {
    // Proxy: ADX + bias agreement as a stand-in for breadth when full breadth feed absent.
    if (adx == null) return 64;
    if (adx >= 25 && context.overallBias !== 'neutral') return 84;
    if (adx < 18) return 60;
    return 72;
  })();

  const regimeLabel = context.decisionIntelligence?.regimeLabel;
  const regimeScore = (() => {
    if (!regimeLabel) return 66;
    if (context.overallBias === 'neutral') return 70;
    return 86;
  })();

  const pillars: ConfidencePillar[] = [
    pillar(
      'trend',
      'Trend',
      trendScore,
      context.trend
        ? `Structure reads ${context.trend} with ${context.overallBias ?? 'mixed'} bias — structure fit, not a forecast.`
        : 'Trend structure unavailable in this context.',
      Boolean(context.trend && context.overallBias !== 'neutral'),
    ),
    pillar(
      'momentum',
      'Momentum',
      momentumScore,
      rsi != null
        ? `RSI at ${rsi.toFixed(0)} (${context.rsi?.signal ?? 'n/a'}) — evidence of momentum state.`
        : 'RSI not available for this symbol/context.',
      rsi != null && rsi >= 40 && rsi <= 70,
    ),
    pillar(
      'volume',
      'Volume',
      volumeScore,
      context.quote?.volume
        ? `Quoted volume ${Math.round(context.quote.volume).toLocaleString()} supports participation quality.`
        : 'Volume not present on this quote — participation evidence is thinner.',
      Boolean(context.quote?.volume && context.quote.volume > 0),
    ),
    pillar(
      'volatility',
      'Volatility',
      volatilityScore,
      atr && price
        ? `ATR ≈ ${((atr / price) * 100).toFixed(2)}% of price — sizing/invalidation research context.`
        : 'ATR unavailable; volatility pillar is approximate.',
      Boolean(atr && price),
    ),
    pillar(
      'macro',
      'Macro',
      macroScore,
      fg != null
        ? `Fear & Greed ${fg} (${context.fearGreedLabel ?? 'n/a'}) — sentiment backdrop only.`
        : 'Macro sentiment index not loaded for this session.',
      fg != null,
    ),
    pillar(
      'news',
      'News',
      newsScore,
      newsCount
        ? `${newsCount} headline(s) attached for catalyst awareness — not trade instructions.`
        : 'No recent headlines attached; news evidence is sparse.',
      newsCount > 0,
    ),
    pillar(
      'breadth',
      'Market Breadth',
      breadthScore,
      adx != null
        ? `ADX ${adx.toFixed(0)} used as a trend-strength proxy when full breadth is unavailable.`
        : 'Breadth/ADX proxy unavailable.',
      adx != null && adx >= 20,
    ),
    pillar(
      'regimeFit',
      'Regime Fit',
      regimeScore,
      regimeLabel
        ? `Decision regime context: ${regimeLabel}. Fit describes process alignment, not direction.`
        : 'Regime label not yet attached from Decision OS.',
      Boolean(regimeLabel),
    ),
    pillar(
      'dataFreshness',
      'Data Freshness',
      freshnessScore,
      `Market context assembled ${freshness} (${new Date(context.assembledAt).toLocaleString()}).`,
      freshness === 'live' || freshness === 'recent',
    ),
  ];

  const weighted =
    pillars.reduce((s, p) => s + p.score, 0) / Math.max(1, pillars.length);
  const overall = clamp(weighted);

  return {
    overall,
    label: TRUST_LANGUAGE.outputQuality.name,
    pillars,
    notice: NON_PREDICTION_COPY,
  };
}
