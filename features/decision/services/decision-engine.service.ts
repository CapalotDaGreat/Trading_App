import { analyzeChart } from '@/features/charts/services/chart-analysis.service';
import {
  CORE_BENCHMARKS,
  MARKET_DATA_POLICY,
  withFetchedAt,
  type LiveQuote,
} from '@/features/markets/constants/freshness';
import {
  buildAssetFromSymbol,
  fetchCandles,
  fetchFearGreedIndex,
  fetchQuotes,
} from '@/features/markets/services/market-data.service';
import { fetchFinancialNews } from '@/features/news/services/news.service';
import type { Candle, Quote } from '@/shared/types/market';

import { biasFromScore, buildExplainability } from './explainability.service';
import type {
  DecisionBias,
  DecisionBrief,
  ImpactLevel,
  MarketRegime,
  MtfConsensus,
  MtfFrameBias,
  RegimeSnapshot,
  SetupCardData,
} from '../types/decision.types';

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

async function safeQuotes(symbols: string[]): Promise<LiveQuote[]> {
  const quotes = await fetchQuotes([...symbols]);
  return quotes.map((q) => withFetchedAt(q, buildAssetFromSymbol(q.symbol).marketType));
}

function avgChange(quotes: Quote[]): number {
  if (!quotes.length) return 0;
  return quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length;
}

export async function detectRegime(): Promise<RegimeSnapshot> {
  const [quotes, fearGreed] = await Promise.all([
    safeQuotes([...CORE_BENCHMARKS]),
    fetchFearGreedIndex().catch(() => null),
  ]);

  const avg = avgChange(quotes);
  const absAvg = Math.abs(avg);
  const fg = fearGreed?.value;

  let regime: MarketRegime = 'ranging';
  if (absAvg > 1.2 || (fg !== undefined && (fg < 25 || fg > 75))) {
    regime = 'high_volatility';
  } else if (avg > 0.35 && (fg === undefined || fg >= 45)) {
    regime = 'risk_on';
  } else if (avg < -0.35 || (fg !== undefined && fg < 40)) {
    regime = 'risk_off';
  } else if (absAvg > 0.2) {
    regime = 'trending';
  }

  const labelMap: Record<MarketRegime, string> = {
    risk_on: 'Risk-On',
    risk_off: 'Risk-Off',
    ranging: 'Ranging',
    high_volatility: 'High Volatility',
    trending: 'Trending',
  };

  const trend: DecisionBias = avg > 0.2 ? 'bullish' : avg < -0.2 ? 'bearish' : 'neutral';
  const volatility: ImpactLevel =
    regime === 'high_volatility' ? 'high' : absAvg > 0.5 ? 'medium' : 'low';

  const strategyMap: Record<MarketRegime, { best: string[]; avoid: string[] }> = {
    risk_on: { best: ['Momentum', 'Swing longs', 'Breakout continuation'], avoid: ['Aggressive shorting'] },
    risk_off: { best: ['Capital preservation', 'Defensive hedges', 'Selective shorts'], avoid: ['FOMO breakouts'] },
    ranging: { best: ['Mean reversion', 'Support/resistance fades'], avoid: ['Breakout chasing'] },
    high_volatility: { best: ['Smaller size', 'Wider stops / defined risk'], avoid: ['Oversized entries'] },
    trending: { best: ['Pullback entries with trend', 'Swing'], avoid: ['Counter-trend picks'] },
  };

  const asOf = Date.now();
  const factors = [
    {
      label: 'Benchmark average change',
      agrees: true,
      detail: `${round(avg)}% across ${quotes.length || CORE_BENCHMARKS.length} benchmarks`,
    },
    {
      label: 'Fear & Greed',
      agrees: fg !== undefined,
      detail: fg !== undefined ? `${fg} (${fearGreed?.classification ?? 'N/A'})` : 'Unavailable',
    },
    {
      label: 'Quote freshness',
      agrees: quotes.every((q) => Date.now() - q.fetchedAt < MARKET_DATA_POLICY.maxQuoteAgeMs),
      detail: quotes.length ? `${quotes.length} live quotes` : 'Using delayed/fallback quotes',
    },
  ];

  return {
    regime,
    label: labelMap[regime],
    volatility,
    trend,
    liquidity: 'high',
    bestStrategies: strategyMap[regime].best,
    avoidStrategies: strategyMap[regime].avoid,
    fearGreed: fg,
    asOf,
    explainability: buildExplainability({
      confidence: 55 + Math.min(30, absAvg * 20),
      factors,
      dataAsOf: asOf,
      reasoning: `Regime classified as ${labelMap[regime]} from live benchmark moves and sentiment.`,
    }),
  };
}

async function analyzeSymbolSetup(symbol: string, quote?: LiveQuote): Promise<SetupCardData | null> {
  try {
    const marketType = buildAssetFromSymbol(symbol).marketType;
    const candles = await fetchCandles({ symbol, marketType, interval: '1d', limit: 90 });
    if (candles.length < 30) return null;

    const analysis = analyzeChart(candles);
    const bias = analysis.summary.overallBias;
    const confidence = Math.round(analysis.summary.confidence * 100) || 50;
    const last = candles[candles.length - 1];
    const support = analysis.summary.supportLevels[0];
    const resistance = analysis.summary.resistanceLevels[0];
    const pattern = analysis.summary.recentPatterns[0];

    const why: string[] = [];
    if (analysis.summary.trend) why.push(`Daily structure: ${analysis.summary.trend}`);
    if (analysis.summary.rsiSignal) why.push(`RSI: ${analysis.summary.rsiSignal}`);
    if (analysis.summary.macdSignal) why.push(`MACD: ${analysis.summary.macdSignal}`);
    if (pattern) why.push(`Recent pattern: ${pattern}`);
    if (!why.length) why.push('Mixed signals — wait for clearer confirmation');

    const status =
      confidence >= 65 ? 'forming' : confidence >= 45 ? 'watching' : 'watching';

    const title =
      bias === 'bullish'
        ? pattern
          ? `Bullish ${pattern}`
          : 'Bullish structure watch'
        : bias === 'bearish'
          ? pattern
            ? `Bearish ${pattern}`
            : 'Bearish structure watch'
          : 'Range / wait';

    const asOf = Date.now();
    return {
      id: `${symbol}-${asOf}`,
      symbol,
      title,
      bias,
      status,
      confidence: Math.max(40, confidence),
      why,
      invalidation:
        bias === 'bullish' && support
          ? `Below ${round(support)}`
          : bias === 'bearish' && resistance
            ? `Above ${round(resistance)}`
            : undefined,
      risk: confidence > 70 ? 'medium' : 'low',
      entryZone:
        last && support && resistance
          ? { low: round(Math.min(support, last.close)), high: round(Math.max(resistance, last.close)) }
          : undefined,
      lastPrice: quote?.price ?? last.close,
      changePercent: quote?.changePercent,
      explainability: buildExplainability({
        confidence: Math.max(40, confidence),
        factors: [
          { label: 'Trend', agrees: bias !== 'neutral', detail: analysis.summary.trend },
          { label: 'RSI', agrees: analysis.summary.rsiSignal !== 'neutral', detail: analysis.summary.rsiSignal },
          { label: 'MACD', agrees: analysis.summary.macdSignal !== 'neutral', detail: analysis.summary.macdSignal },
          {
            label: 'Fresh quote',
            agrees: Boolean(quote && Date.now() - quote.fetchedAt < MARKET_DATA_POLICY.maxQuoteAgeMs),
            detail: quote ? `${round(quote.changePercent)}%` : 'Candle close only',
          },
        ],
        dataAsOf: asOf,
        reasoning: `${why.length} factors assessed on daily timeframe. This is research prioritization — not a buy/sell order.`,
      }),
    };
  } catch {
    return null;
  }
}

export async function buildSetupRadar(symbols: string[]): Promise<SetupCardData[]> {
  const unique = [...new Set(symbols)].slice(0, 12);
  const quotes = await safeQuotes(unique);
  const quoteMap = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

  const setups = await Promise.all(
    unique.map((symbol) =>
      analyzeSymbolSetup(symbol, quoteMap.get(symbol.toUpperCase()) ?? quoteMap.get(symbol)),
    ),
  );

  return setups
    .filter((s): s is SetupCardData => Boolean(s))
    .sort((a, b) => b.confidence - a.confidence);
}

export async function buildDecisionBrief(input?: {
  watchlistSymbols?: string[];
  portfolioChangePercent?: number;
}): Promise<DecisionBrief> {
  const watch = input?.watchlistSymbols?.length
    ? input.watchlistSymbols.slice(0, 8)
    : ['NVDA', 'AAPL', 'SPY', 'BTC/USD', 'EUR/USD'];

  const [regime, quotes, news, setups] = await Promise.all([
    detectRegime(),
    safeQuotes([...CORE_BENCHMARKS, ...watch.slice(0, 5)]),
    fetchFinancialNews({ pageSize: 6 }).catch(() => ({
      articles: [] as { id: string; title: string }[],
      totalResults: 0,
      source: 'rss' as const,
    })),
    buildSetupRadar(watch),
  ]);

  const topSetups = setups.slice(0, 3);
  const quotesFetchedAt = Math.max(...quotes.map((q) => q.fetchedAt), Date.now());

  const summary =
    topSetups.length > 0
      ? `${regime.label} tape. ${topSetups.length} watchlist setup${topSetups.length === 1 ? '' : 's'} deserve research time — start with ${topSetups[0].symbol}.`
      : `${regime.label} tape. No high-conviction setups yet — reduce forcing trades and wait for clearer structure.`;

  return {
    greeting: greetingForNow(),
    generatedAt: Date.now(),
    regime: regime.regime,
    regimeLabel: regime.label,
    portfolioChangePercent: input?.portfolioChangePercent,
    highImpactEvents: news.articles.slice(0, 3).map((a, i) => ({
      id: a.id,
      title: a.title,
      at: Date.now() + i * 3600_000,
      impact: (i === 0 ? 'high' : 'medium') as ImpactLevel,
    })),
    setupCount: setups.length,
    topSetups,
    watchFocus: watch.slice(0, 4),
    headline: `Markets: ${regime.label}`,
    summary,
    suggestResearch: topSetups.slice(0, 2).map((s) => s.symbol),
    explainability: regime.explainability,
    quotesFetchedAt,
  };
}

function candleBias(candles: Candle[]): MtfFrameBias {
  if (candles.length < 20) {
    return { interval: 'n/a', bias: 'neutral', confidence: 40 };
  }
  const analysis = analyzeChart(candles);
  return {
    interval: '',
    bias: analysis.summary.overallBias,
    confidence: Math.round(analysis.summary.confidence * 100) || 50,
  };
}

export async function buildMtfConsensus(symbol: string): Promise<MtfConsensus> {
  const marketType = buildAssetFromSymbol(symbol).marketType;
  const framesSpec = [
    { interval: '15m' as const, label: '15m', limit: 80 },
    { interval: '1h' as const, label: '1H', limit: 80 },
    { interval: '4h' as const, label: '4H', limit: 80 },
    { interval: '1d' as const, label: 'Daily', limit: 90 },
    { interval: '1w' as const, label: 'Weekly', limit: 52 },
  ];

  const results = await Promise.all(
    framesSpec.map(async (spec) => {
      try {
        const candles = await fetchCandles({
          symbol,
          marketType,
          interval: spec.interval,
          limit: spec.limit,
        });
        const frame = candleBias(candles);
        return { ...frame, interval: spec.label } satisfies MtfFrameBias;
      } catch {
        return { interval: spec.label, bias: 'neutral' as const, confidence: 35 };
      }
    }),
  );

  let bull = 0;
  let bear = 0;
  for (const f of results) {
    const weight = f.confidence / 100;
    if (f.bias === 'bullish') bull += weight;
    if (f.bias === 'bearish') bear += weight;
  }

  const consensus = biasFromScore(bull * 10, bear * 10);
  const total = bull + bear || 1;
  const consensusScore = Math.round((Math.abs(bull - bear) / total) * 100);

  const mismatch = results.find((f) => f.bias !== consensus && f.bias !== 'neutral');
  const explanation =
    mismatch && consensus !== 'neutral'
      ? `${mismatch.interval} is ${mismatch.bias} while higher-timeframe lean is ${consensus}. Wait for alignment before prioritizing this trade for research.`
      : `Multi-timeframe lean is ${consensus} with ${consensusScore}% agreement score. Use this to decide whether the chart is worth your research time.`;

  return {
    symbol,
    frames: results,
    consensus,
    consensusScore: Math.max(40, consensusScore),
    explanation,
    asOf: Date.now(),
  };
}

export { safeQuotes, avgChange };
