import { fetchEconomicCalendar } from '@/features/calendar/services/economic-calendar.service';
import { analyzeChart } from '@/features/charts/services/chart-analysis.service';
import {
  countExplicitDecisionOutcomes,
  getDecisionRecords,
  summarizeDecisionLog,
} from '@/features/decision-log/services/decision-log.service';
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
  fetchQuoteWithMetadata,
} from '@/features/markets/services/market-data.service';
import { fetchFinancialNews } from '@/features/news/services/news.service';
import { performanceDiagnostics } from '@/shared/services/performance';
import type { Candle, Quote } from '@/shared/types/market';

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

import { buildResearchQueue, buildTradingDayPlan } from './coaching-loop.service';
import { recordConvictionPoint } from './conviction-drift.service';
import {
  buildDecisionDebt,
  buildDecisionFatigue,
  buildDecisionIntelligenceContext,
} from './decision-os.service';
import { biasFromScore, buildExplainability, buildCounterfactuals } from './explainability.service';
import { prioritizeResearch } from './research-prioritizer.service';
import {
  buildResearchBalance,
  computeDecisionQualityScore,
  computeResearchValueScore,
} from './research-value.service';
import { buildSetupResearchChecklist, historyNoteForSetup } from './setup-enrichment.service';
import { applyLifecycleToSetups } from './setup-lifecycle.service';
import { loadTraderMemory } from './trader-intelligence.service';
import { buildSkipSuggestions, buildWhyNot } from './why-not.service';

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
  const results = await Promise.allSettled(symbols.map((symbol) => fetchQuoteWithMetadata(symbol)));
  return results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchQuoteWithMetadata>>> =>
        result.status === 'fulfilled',
    )
    .map(({ value }) => ({
      ...withFetchedAt(value.quote, buildAssetFromSymbol(value.quote.symbol).marketType),
      fetchedAt: value.fetchedAt,
    }));
}

function avgChange(quotes: Quote[]): number {
  if (!quotes.length) return 0;
  return quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length;
}

function quotesForBenchmarks(quotes: LiveQuote[]): LiveQuote[] {
  const wanted = new Set(CORE_BENCHMARKS.map((symbol) => symbol.toUpperCase()));
  return quotes.filter((quote) => wanted.has(quote.symbol.toUpperCase()));
}

export async function detectRegime(prefetchedQuotes?: LiveQuote[]): Promise<RegimeSnapshot> {
  const benchmarkQuotes = prefetchedQuotes?.length
    ? quotesForBenchmarks(prefetchedQuotes)
    : undefined;
  const [quotes, fearGreed] = await Promise.all([
    benchmarkQuotes?.length ? Promise.resolve(benchmarkQuotes) : safeQuotes([...CORE_BENCHMARKS]),
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
    risk_on: {
      best: ['Momentum', 'Swing longs', 'Breakout continuation'],
      avoid: ['Aggressive shorting'],
    },
    risk_off: {
      best: ['Capital preservation', 'Defensive hedges', 'Selective shorts'],
      avoid: ['FOMO breakouts'],
    },
    ranging: { best: ['Mean reversion', 'Support/resistance fades'], avoid: ['Breakout chasing'] },
    high_volatility: {
      best: ['Smaller size', 'Wider stops / defined risk'],
      avoid: ['Oversized entries'],
    },
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

async function analyzeSymbolSetup(
  symbol: string,
  quote?: LiveQuote,
): Promise<{ setup: SetupCardData; lastCandle: Candle } | null> {
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
    if (!why.length) why.push('Mixed technical evidence — wait for clearer confirmation');

    const status = confidence >= 65 ? 'forming' : confidence >= 45 ? 'watching' : 'watching';

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
    const setup: SetupCardData = {
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
          ? {
              low: round(Math.min(support, last.close)),
              high: round(Math.max(resistance, last.close)),
            }
          : undefined,
      lastPrice: quote?.price ?? last.close,
      changePercent: quote?.changePercent,
      explainability: buildExplainability({
        confidence: Math.max(40, confidence),
        factors: [
          { label: 'Trend', agrees: bias !== 'neutral', detail: analysis.summary.trend },
          {
            label: 'RSI',
            agrees: analysis.summary.rsiSignal !== 'neutral',
            detail: analysis.summary.rsiSignal,
          },
          {
            label: 'MACD',
            agrees: analysis.summary.macdSignal !== 'neutral',
            detail: analysis.summary.macdSignal,
          },
          {
            label: 'Fresh quote',
            agrees: Boolean(
              quote && Date.now() - quote.fetchedAt < MARKET_DATA_POLICY.maxQuoteAgeMs,
            ),
            detail: quote ? `${round(quote.changePercent)}%` : 'Candle close only',
          },
        ],
        dataAsOf: asOf,
        reasoning: `${why.length} factors assessed on daily timeframe. This is research prioritization — not a buy/sell order.`,
      }),
    };

    return {
      setup: {
        ...setup,
        setupTypeLabel:
          bias === 'neutral'
            ? 'Wait / range'
            : pattern
              ? `${bias === 'bullish' ? 'Bullish' : 'Bearish'} ${pattern}`
              : 'Trend continuation',
        researchChecklist: buildSetupResearchChecklist(setup),
        explainability: {
          ...setup.explainability,
          counterfactuals: buildCounterfactuals({
            confidence: setup.confidence,
            factors: setup.explainability.factors,
            rsiSignal: analysis.summary.rsiSignal,
          }),
        },
      },
      lastCandle: last,
    };
  } catch {
    return null;
  }
}

export async function buildSetupRadar(
  symbols: string[],
  prefetchedQuotes?: LiveQuote[],
): Promise<SetupCardData[]> {
  const unique = [...new Set(symbols)].slice(0, 12);
  const quoteMap = new Map(
    (prefetchedQuotes ?? []).map((quote) => [quote.symbol.toUpperCase(), quote] as const),
  );
  const missing = unique.filter((symbol) => !quoteMap.has(symbol.toUpperCase()));
  if (missing.length) {
    const fetched = await safeQuotes(missing);
    for (const quote of fetched) {
      quoteMap.set(quote.symbol.toUpperCase(), quote);
    }
  }

  const analyzed = await Promise.all(
    unique.map((symbol) =>
      analyzeSymbolSetup(symbol, quoteMap.get(symbol.toUpperCase()) ?? quoteMap.get(symbol)),
    ),
  );

  const candleMap = new Map<string, Candle>();
  const setups: SetupCardData[] = [];
  for (const result of analyzed) {
    if (!result) continue;
    setups.push(result.setup);
    candleMap.set(result.setup.symbol.toUpperCase(), result.lastCandle);
  }

  return applyLifecycleToSetups(setups, candleMap)
    .map((setup) => ({
      ...setup,
      researchChecklist: setup.researchChecklist ?? buildSetupResearchChecklist(setup),
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function buildDecisionBriefInternal(input?: {
  watchlistSymbols?: string[];
  portfolioChangePercent?: number;
  portfolioSymbols?: string[];
  uid?: string | null;
  timeBudgetMinutes?: number;
}): Promise<DecisionBrief> {
  const memory = await loadTraderMemory();
  const portfolioSyms = input?.portfolioSymbols ?? [];
  const watch = input?.watchlistSymbols?.length
    ? [...new Set([...input.watchlistSymbols, ...memory.favoriteAssets, ...portfolioSyms])].slice(
        0,
        10,
      )
    : [...new Set([...memory.favoriteAssets, 'NVDA', 'AAPL', 'SPY', 'BTC/USD', 'EUR/USD'])].slice(
        0,
        8,
      );

  const now = Date.now();
  // One shared quote batch feeds regime + radar; candle lifecycle reuses radar series.
  const quotes = await safeQuotes([...CORE_BENCHMARKS, ...watch.slice(0, 8)]);
  const [regime, calendarEvents, news, setups, logRecords] = await Promise.all([
    detectRegime(quotes),
    fetchEconomicCalendar({
      from: now - 12 * 60 * 60 * 1000,
      to: now + 48 * 60 * 60 * 1000,
      impact: ['high', 'medium'],
    }).catch(() => []),
    fetchFinancialNews({ pageSize: 4 }).catch(() => ({
      articles: [] as { id: string; title: string }[],
      totalResults: 0,
      source: 'rss' as const,
    })),
    buildSetupRadar(watch, quotes),
    getDecisionRecords(input?.uid).catch(() => []),
  ]);

  const logSummary = summarizeDecisionLog(logRecords);
  const calendarSource =
    calendarEvents.length && calendarEvents[0]?.source === 'finnhub' ? 'finnhub' : 'mock';

  const events =
    calendarEvents.length > 0
      ? calendarEvents.slice(0, 4).map((e) => ({
          id: e.id,
          title: e.title,
          at: e.scheduledAt,
          impact: e.impact as ImpactLevel,
        }))
      : news.articles.slice(0, 3).map((a, i) => ({
          id: a.id,
          title: a.title,
          at: now + i * 3600_000,
          impact: (i === 0 ? 'high' : 'medium') as ImpactLevel,
        }));

  const quotesFetchedAt = Math.max(...quotes.map((q) => q.fetchedAt), Date.now());
  const budget = input?.timeBudgetMinutes ?? 20;

  const enrichedSetups = setups.map((setup) => {
    const withChecklist = {
      ...setup,
      researchChecklist: setup.researchChecklist ?? buildSetupResearchChecklist(setup),
      historyNote: historyNoteForSetup(setup, memory),
      whyNot: buildWhyNot(setup, regime.regime, memory, events.length),
    };
    const rvs = computeResearchValueScore({
      setup: withChecklist,
      regime: regime.regime,
      memory,
      portfolioSymbols: portfolioSyms,
      eventCount: events.length,
      timeBudgetMinutes: budget,
    });
    const dqs = computeDecisionQualityScore(withChecklist);
    const balance = buildResearchBalance(withChecklist, enrichedAlternatives(setups, setup.symbol));
    const scored: SetupCardData = {
      ...withChecklist,
      confidence: dqs.score,
      researchValueScore: rvs.score,
      decisionQualityScore: dqs.score,
      researchValueExplanation: rvs.explanation,
      decisionQualityExplanation: dqs.explanation,
      reasonsToResearch: balance.reasonsToResearch,
      reasonsNotToResearch: balance.reasonsNotToResearch,
      missingConfirmations: balance.missingConfirmations,
      alternativeSymbols: balance.alternativeSymbols,
    };
    void recordConvictionPoint(setup.symbol, {
      researchValue: rvs.score,
      decisionQuality: dqs.score,
      risk: setup.risk,
      note: `Brief refresh · RVS ${rvs.score} · DQS ${dqs.score}`,
    }).catch(() => undefined);
    return scored;
  });

  // Rank by research value (attention), not raw chart confidence
  enrichedSetups.sort(
    (a, b) => (b.researchValueScore ?? b.confidence) - (a.researchValueScore ?? a.confidence),
  );

  const topSetups = enrichedSetups.slice(0, 3);
  const priorities = prioritizeResearch(
    {
      greeting: '',
      generatedAt: now,
      regime: regime.regime,
      regimeLabel: regime.label,
      highImpactEvents: events,
      setupCount: enrichedSetups.length,
      topSetups,
      watchFocus: watch.slice(0, 4),
      headline: '',
      summary: '',
      suggestResearch: topSetups.slice(0, 2).map((s) => s.symbol),
      explainability: regime.explainability,
      quotesFetchedAt,
    },
    enrichedSetups,
    budget,
  );
  const timeBudgetPick = priorities.map((p) => p.symbol);

  const startSymbol = timeBudgetPick[0] ?? topSetups[0]?.symbol;
  const researchQueue = buildResearchQueue(priorities);
  const estimatedResearchMinutes = researchQueue.reduce((s, q) => s + q.estimatedMinutes, 0);
  const risks = enrichedSetups.filter(
    (s) => s.risk === 'high' || s.status === 'invalidated' || (s.whyNot?.reasons.length ?? 0) >= 2,
  ).length;

  const explicitDecisionsToday = countExplicitDecisionOutcomes(logRecords, Date.now() - 86_400_000);

  const intel = buildDecisionIntelligenceContext({
    regime: regime.regime,
    regimeLabel: regime.label,
    timeBudgetMinutes: budget,
    watchlistSymbols: watch,
    portfolioSymbols: portfolioSyms,
    traderMemory: memory,
    processScoreWeek: logSummary.processScore,
    eventTitles: events.map((e) => e.title),
    topSetupSymbols: topSetups.map((s) => s.symbol),
  });

  const fatigue = buildDecisionFatigue({
    reviewedToday: explicitDecisionsToday,
    queueRemaining: researchQueue.filter((q) => !q.completed).length,
  });

  const decisionDebt = buildDecisionDebt({
    unreviewedSetups: Math.max(0, enrichedSetups.length - explicitDecisionsToday),
    incompleteJournals: Math.max(0, logSummary.researched - logSummary.journaled),
    unfinishedLessons: 0,
    ignoredAlerts: 0,
    unfinishedReplay: 0,
  });

  const summary = fatigue.shouldStop
    ? `${regime.label} tape. ${fatigue.message}`
    : topSetups.length > 0
      ? `${regime.label} tape. ${topSetups.length} setup${topSetups.length === 1 ? '' : 's'} deserve research — start with ${startSymbol} (RVS ${topSetups[0]?.researchValueScore ?? '—'}).`
      : `${regime.label} tape. No high-quality setups yet — reduce forcing trades and wait for clearer structure.`;

  const memoryBoost = memory.bestSetups.length
    ? topSetups.filter((s) =>
        memory.bestSetups.some((b) =>
          s.title.toLowerCase().includes(b.toLowerCase().split(' ')[0] ?? ''),
        ),
      )
    : topSetups;

  const suggestResearch = [
    ...new Set([
      ...memoryBoost.slice(0, 1).map((s) => s.symbol),
      ...topSetups.slice(0, 2).map((s) => s.symbol),
    ]),
  ].slice(0, 3);

  const draftBrief = {
    greeting: greetingForNow(),
    generatedAt: now,
    regime: regime.regime,
    regimeLabel: regime.label,
    regimeSnapshot: regime,
    portfolioChangePercent: input?.portfolioChangePercent,
    highImpactEvents: events,
    setupCount: enrichedSetups.length,
    topSetups,
    watchFocus: watch.slice(0, 4),
    headline: `Markets: ${regime.label}`,
    summary,
    suggestResearch,
    explainability: regime.explainability,
    quotesFetchedAt,
    startHereSymbol: startSymbol,
    processScoreWeek: logSummary.processScore,
    calendarSource: (calendarEvents.length
      ? calendarSource
      : 'rss') as DecisionBrief['calendarSource'],
    timeBudgetPick,
    focusSummary: {
      opportunities: topSetups.length,
      risks: Math.max(risks, portfolioSyms.length > 3 ? 1 : 0),
      events: events.length,
    },
    estimatedResearchMinutes,
    researchQueue,
    skipSuggestions: buildSkipSuggestions(enrichedSetups, regime.regime, memory, events.length, 2),
    decisionDebt,
    fatigue,
    psychologyReminder: intel.psychologyReminder,
    recommendedFocus: intel.recommendedFocus,
    decisionQualityTrend: logSummary.processScore,
    timeBudgetMinutes: budget,
  } satisfies Omit<DecisionBrief, 'tradingDayPlan'>;

  return {
    ...draftBrief,
    tradingDayPlan: buildTradingDayPlan(draftBrief),
  };
}

export function buildDecisionBrief(input?: {
  watchlistSymbols?: string[];
  portfolioChangePercent?: number;
  portfolioSymbols?: string[];
  uid?: string | null;
  timeBudgetMinutes?: number;
}): Promise<DecisionBrief> {
  return performanceDiagnostics.measureAsync('brief.build', () =>
    buildDecisionBriefInternal(input),
  );
}

function enrichedAlternatives(setups: SetupCardData[], symbol: string): string[] {
  return setups
    .filter((s) => s.symbol.toUpperCase() !== symbol.toUpperCase())
    .slice(0, 4)
    .map((s) => s.symbol);
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
