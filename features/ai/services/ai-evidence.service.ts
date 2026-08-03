import type { AiEnrichedContext, AiSentiment } from '../types/ai.types';
import type { EvidenceItem, EvidencePack } from '../types/ai-trust.types';

function observationFromContext(context: AiEnrichedContext): string {
  const bias = context.overallBias ?? 'neutral';
  const rsi = context.rsi;
  if (rsi?.signal === 'overbought') {
    return 'Momentum looks stretched on the upside — research invalidation before adding attention.';
  }
  if (rsi?.signal === 'oversold') {
    return 'Momentum looks stretched on the downside — confirm structure before researching a reversal thesis.';
  }
  if (bias === 'bullish') {
    return 'Technical structure currently leans constructive — treat this as research priority, not a buy signal.';
  }
  if (bias === 'bearish') {
    return 'Technical structure currently leans defensive — treat this as research priority, not a sell signal.';
  }
  return 'Evidence is mixed — slow down and write what would change your conclusion before spending more time.';
}

/**
 * Links each supporting module back into the app (Expo Router paths).
 */
export function buildEvidencePack(
  context: AiEnrichedContext,
  sentiment?: AiSentiment,
): EvidencePack {
  const symbol = context.symbol;
  const assetHref = symbol ? (`/asset/${encodeURIComponent(symbol)}` as const) : undefined;

  const items: EvidenceItem[] = [
    {
      id: 'quote',
      label: 'Quote',
      detail: context.quote
        ? `Last ${context.quote.price} (${context.quote.changePercent.toFixed(2)}%)`
        : 'Quote missing',
      href: assetHref,
      present: Boolean(context.quote),
    },
    {
      id: 'rsi',
      label: 'RSI',
      detail: context.rsi
        ? `${context.rsi.value.toFixed(1)} · ${context.rsi.signal}`
        : 'Not loaded',
      href: assetHref,
      present: Boolean(context.rsi),
    },
    {
      id: 'macd',
      label: 'MACD',
      detail: context.macd
        ? `${context.macd.signal}${context.macd.histogram != null ? ` · hist ${context.macd.histogram.toFixed(3)}` : ''}`
        : 'Not loaded',
      href: assetHref,
      present: Boolean(context.macd),
    },
    {
      id: 'adx',
      label: 'ADX',
      detail: context.adx != null ? String(context.adx) : 'Not loaded',
      href: assetHref,
      present: context.adx != null,
    },
    {
      id: 'volume',
      label: 'Volume',
      detail:
        context.quote?.volume != null
          ? Math.round(context.quote.volume).toLocaleString()
          : 'Not on quote',
      href: assetHref,
      present: context.quote?.volume != null,
    },
    {
      id: 'structure',
      label: 'Market Structure',
      detail: [
        context.trend ? `Trend ${context.trend}` : null,
        context.supportLevels?.[0] != null ? `Support ~${context.supportLevels[0]}` : null,
        context.resistanceLevels?.[0] != null ? `Resistance ~${context.resistanceLevels[0]}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'Structure incomplete',
      href: assetHref,
      present: Boolean(context.trend || context.supportLevels?.length),
    },
    {
      id: 'news',
      label: 'Recent News',
      detail: context.newsHeadlines?.length
        ? context.newsHeadlines
            .slice(0, 2)
            .map((n) => n.title)
            .join(' · ')
        : 'No headlines attached',
      href: '/(tabs)/research',
      present: Boolean(context.newsHeadlines?.length),
    },
    {
      id: 'regime',
      label: 'Regime',
      detail: context.decisionIntelligence?.regimeLabel ?? 'Regime not linked',
      href: '/decision/regime',
      present: Boolean(context.decisionIntelligence?.regimeLabel),
    },
    {
      id: 'portfolio',
      label: 'Portfolio Context',
      detail: context.portfolioHoldings?.length
        ? `${context.portfolioHoldings.length} holding(s) in context`
        : 'No holdings in this request',
      href: '/(tabs)/portfolio',
      present: Boolean(context.portfolioHoldings?.length),
    },
    {
      id: 'memory',
      label: 'Trader Memory',
      detail: context.decisionIntelligence?.psychologyReminder
        ? context.decisionIntelligence.psychologyReminder.slice(0, 120)
        : 'Memory not attached',
      href: '/decision/memory',
      present: Boolean(context.decisionIntelligence?.psychologyReminder),
    },
  ];

  return {
    observation: observationFromContext({
      ...context,
      overallBias: sentiment ?? context.overallBias,
    }),
    items,
  };
}
