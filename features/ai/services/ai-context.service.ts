import { analyzeChart } from '@/features/charts/services/chart-analysis.service';
import { INDICATOR_LABELS, type IndicatorType } from '@/features/charts/utils/indicators';
import {
  buildAssetFromSymbol,
  fetchCandles,
  fetchFearGreedIndex,
  fetchQuote,
  fetchQuotes,
} from '@/features/markets/services/market-data.service';
import { fetchFinancialNews, type NewsArticle } from '@/features/news/services/news.service';
import { buildDecisionIntelligenceContext } from '@/features/decision/services/decision-os.service';
import { loadTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import type { Candle } from '@/shared/types/market';

import type { AiEnrichedContext, AiRequestContext } from '../types/ai.types';

const ALL_INDICATORS: IndicatorType[] = [
  'rsi',
  'macd',
  'bollinger',
  'ema',
  'sma',
  'atr',
  'adx',
  'stochastic',
  'vwap',
];

const MARKET_BENCHMARKS = ['SPY', 'QQQ', 'DIA', 'IWM', 'BTC/USD', 'EUR/USD'];

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function latestValue<T extends { value: number }>(values: T[] | undefined): number | undefined {
  return values?.[values.length - 1]?.value;
}

export async function buildSymbolContext(symbol: string): Promise<AiEnrichedContext> {
  const [quote, candles, fearGreed] = await Promise.all([
    fetchQuote(symbol).catch(() => null),
    fetchCandles({
      symbol,
      marketType: buildAssetFromSymbol(symbol).marketType,
      interval: '1d',
      limit: 120,
    }).catch((): Candle[] => []),
    fetchFearGreedIndex().catch(() => null),
  ]);

  const chartAnalysis = candles.length >= 20 ? analyzeChart(candles, ALL_INDICATORS) : null;
  const summary = chartAnalysis?.summary;
  const indicators = chartAnalysis?.indicators ?? {};
  const patterns = chartAnalysis?.patterns;

  const rsiData = indicators.rsi as { values: { value: number }[] } | undefined;
  const macdData = indicators.macd as {
    values: { histogram: number; macd: number; signal: number }[];
  } | undefined;
  const atrData = indicators.atr as { values: { value: number }[] } | undefined;
  const adxData = indicators.adx as { values: { value: number }[] } | undefined;
  const stochData = indicators.stochastic as {
    values: { k: number; d: number }[];
  } | undefined;

  const latestMacd = macdData?.values[macdData.values.length - 1];
  const latestStoch = stochData?.values[stochData.values.length - 1];

  return {
    symbol,
    quote: quote
      ? {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          volume: quote.volume,
          high: quote.high,
          low: quote.low,
        }
      : undefined,
    trend: summary?.trend,
    overallBias: summary?.overallBias,
    biasConfidence: summary ? round(summary.confidence * 100) : undefined,
    rsi: rsiData
      ? {
          value: round(latestValue(rsiData.values) ?? 50),
          signal: summary?.rsiSignal ?? 'neutral',
        }
      : undefined,
    macd: latestMacd
      ? {
          signal: summary?.macdSignal ?? 'neutral',
          histogram: round(latestMacd.histogram, 4),
        }
      : undefined,
    atr: atrData ? round(latestValue(atrData.values) ?? 0, 4) : undefined,
    adx: adxData ? round(latestValue(adxData.values) ?? 0) : undefined,
    stochastic: latestStoch
      ? { k: round(latestStoch.k), d: round(latestStoch.d) }
      : undefined,
    supportLevels: summary?.supportLevels.map((p) => round(p)) ?? [],
    resistanceLevels: summary?.resistanceLevels.map((p) => round(p)) ?? [],
    detectedPatterns:
      patterns?.patterns.slice(-5).map((p) => ({
        name: p.pattern.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        bullish: p.bullish,
        confidence: round(p.confidence * 100),
      })) ?? [],
    availableIndicators: ALL_INDICATORS.map((id) => INDICATOR_LABELS[id]),
    fearGreedIndex: fearGreed?.value,
    fearGreedLabel: fearGreed?.classification,
    assembledAt: Date.now(),
  };
}

export async function buildMarketContext(): Promise<AiEnrichedContext> {
  const [quotes, fearGreed, news] = await Promise.all([
    fetchQuotes(MARKET_BENCHMARKS).catch(() => []),
    fetchFearGreedIndex().catch(() => null),
    fetchFinancialNews({ pageSize: 8 }).catch(() => ({
      articles: [] as NewsArticle[],
      totalResults: 0,
      source: 'rss' as const,
    })),
  ]);

  const avgChange =
    quotes.length > 0
      ? quotes.reduce((sum: number, q) => sum + q.changePercent, 0) / quotes.length
      : 0;

  let overallBias: AiEnrichedContext['overallBias'] = 'neutral';
  if (avgChange > 0.35) overallBias = 'bullish';
  else if (avgChange < -0.35) overallBias = 'bearish';

  return {
    overallBias,
    biasConfidence: Math.min(Math.abs(avgChange) * 20, 85),
    fearGreedIndex: fearGreed?.value,
    fearGreedLabel: fearGreed?.classification,
    newsHeadlines: news.articles.slice(0, 8).map((a) => ({
      id: a.id,
      title: a.title,
      source: a.source,
    })),
    assembledAt: Date.now(),
  };
}

export async function enrichRequestContext(
  context: AiRequestContext = {},
): Promise<AiRequestContext> {
  const enriched: AiEnrichedContext = context.symbol
    ? await buildSymbolContext(context.symbol)
    : await buildMarketContext();

  if (context.portfolio?.length) {
    const totalValue = context.portfolio.reduce(
      (sum, h) => sum + h.quantity * h.avgCost,
      0,
    );
    enriched.portfolioHoldings = context.portfolio.map((h) => ({
      ...h,
      weight: totalValue > 0 ? round((h.quantity * h.avgCost) / totalValue, 4) : 0,
    }));
  }

  if (context.newsIds?.length) {
    const news = await fetchFinancialNews({ pageSize: 12 }).catch(() => ({
      articles: [] as NewsArticle[],
      totalResults: 0,
      source: 'rss' as const,
    }));
    enriched.newsHeadlines = news.articles
      .filter((a: NewsArticle) => context.newsIds!.includes(a.id))
      .map((a: NewsArticle) => ({ id: a.id, title: a.title, source: a.source }));
  } else if (!context.symbol) {
    // market-level context already has headlines
  } else {
    const news = await fetchFinancialNews({ query: context.symbol, pageSize: 6 }).catch(() => ({
      articles: [] as NewsArticle[],
      totalResults: 0,
      source: 'rss' as const,
    }));
    enriched.newsHeadlines = news.articles.map((a: NewsArticle) => ({
      id: a.id,
      title: a.title,
      source: a.source,
    }));
  }

  // Attach Decision Intelligence Context — never generate isolated commentary.
  try {
    const memory = await loadTraderMemory();
    const intel = buildDecisionIntelligenceContext({
      traderMemory: memory,
      portfolioSymbols: context.portfolio?.map((h) => h.symbol) ?? [],
      topSetupSymbols: context.symbol ? [context.symbol] : memory.favoriteAssets.slice(0, 3),
    });
    enriched.decisionIntelligence = {
      psychologyReminder: intel.psychologyReminder,
      recommendedFocus: intel.recommendedFocus,
      tradingStyle: memory.tradingStyle,
      typicalMistakes: memory.typicalMistakes.slice(0, 3),
      coachTone: memory.coachTone,
      markets: memory.markets?.slice(0, 4),
      struggles: memory.struggles?.slice(0, 4),
      researchTimeOfDay: memory.researchTimeOfDay,
      successDefinitions: memory.successDefinitions?.slice(0, 3),
    };
  } catch {
    // demo / offline — AI still works without DNA
  }

  return { ...context, enriched };
}

export function getPrimaryPattern(context: AiEnrichedContext): string | undefined {
  const patterns = context.detectedPatterns ?? [];
  if (patterns.length === 0) return undefined;
  return [...patterns].sort((a, b) => b.confidence - a.confidence)[0]?.name;
}

export function getPrimaryIndicator(context: AiEnrichedContext): string {
  if (context.rsi) return 'RSI (14)';
  return 'RSI (14)';
}
