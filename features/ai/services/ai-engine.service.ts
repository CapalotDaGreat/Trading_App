import { fetchFinancialNews, type NewsArticle } from '@/features/news/services/news.service';
import { formatPercent, formatPrice } from '@/shared/utils/format';

import type {
  AiAnalysisMetadata,
  AiAnalysisResult,
  AiAnalysisType,
  AiCitation,
  AiEnrichedContext,
  AiRequestContext,
  AiSentiment,
} from '../types/ai.types';
import { getPrimaryIndicator, getPrimaryPattern } from './ai-context.service';

function todayKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildMetadata(
  context: AiEnrichedContext,
  confidence: number,
  extraCitations: AiCitation[] = [],
): AiAnalysisMetadata {
  const citations: AiCitation[] = [
    {
      label: 'Data as of',
      value: new Date(context.assembledAt).toLocaleString(),
      timestamp: context.assembledAt,
    },
    ...extraCitations,
  ];

  if (context.symbol) {
    citations.push({ label: 'Symbol', value: context.symbol });
  }
  if (context.quote) {
    citations.push({
      label: 'Last price',
      value: formatPrice(context.quote.price),
    });
    citations.push({
      label: 'Change',
      value: formatPercent(context.quote.changePercent),
    });
  }
  if (context.rsi) {
    citations.push({ label: 'RSI (14)', value: String(context.rsi.value) });
  }
  if (context.trend) {
    citations.push({ label: 'Trend', value: context.trend });
  }

  return {
    source: 'engine',
    confidence: clamp(Math.round(confidence), 35, 92),
    dataAsOf: context.assembledAt,
    citations: [...citations, ...extraCitations],
    symbol: context.symbol,
    modelVersion: 'tradevision-engine-1.0',
  };
}

function nearestLevel(levels: number[], price: number, direction: 'above' | 'below'): number | undefined {
  const filtered =
    direction === 'above'
      ? levels.filter((l) => l > price)
      : levels.filter((l) => l < price);
  if (filtered.length === 0) return undefined;
  return filtered.sort(
    (a, b) =>
      Math.abs(a - price) - Math.abs(b - price),
  )[0];
}

function buildTradeSuggestion(context: AiEnrichedContext): AiAnalysisResult {
  const symbol = context.symbol ?? 'MARKET';
  const price = context.quote?.price ?? 0;
  const bias = context.overallBias ?? 'neutral';
  const confidence = context.biasConfidence ?? 50;

  const support = nearestLevel(context.supportLevels ?? [], price, 'below') ?? price * 0.97;
  const resistance = nearestLevel(context.resistanceLevels ?? [], price, 'above') ?? price * 1.03;
  const atr = context.atr ?? price * 0.02;

  let action: 'buy' | 'sell' | 'hold' | 'watch' = 'watch';
  if (bias === 'bullish' && confidence >= 55) action = 'watch';
  else if (bias === 'bearish' && confidence >= 55) action = 'watch';
  else action = 'hold';

  const why: string[] = [];
  if (context.rsi) {
    why.push(
      `RSI at ${context.rsi.value} indicates ${context.rsi.signal} momentum — ${
        context.rsi.signal === 'overbought'
          ? 'upside may be limited until consolidation'
          : context.rsi.signal === 'oversold'
            ? 'sellers may be exhausted if support holds'
            : 'no extreme reading; trend context matters more'
      }.`,
    );
  }
  if (context.macd) {
    why.push(
      `MACD histogram is ${context.macd.histogram && context.macd.histogram > 0 ? 'positive' : 'negative'}, supporting a ${context.macd.signal} bias on the current timeframe.`,
    );
  }
  if (context.trend) {
    why.push(
      `Price structure shows a ${context.trend.replace('_', ' ')} — trades aligned with trend historically carry better risk/reward.`,
    );
  }
  if (context.detectedPatterns?.length) {
    const top = context.detectedPatterns[0];
    why.push(
      `Recent ${top.name} pattern (${top.confidence}% confidence) ${top.bullish ? 'favors upside continuation if confirmed' : 'suggests caution on long exposure'}.`,
    );
  }
  if (context.adx !== undefined) {
    why.push(
      context.adx >= 25
        ? `ADX at ${context.adx} confirms a trending environment — breakouts/breakdowns deserve attention.`
        : `ADX at ${context.adx} suggests a range-bound market — mean-reversion setups may outperform breakouts.`,
    );
  }

  const entryLow = bias === 'bullish' ? support : price * 0.995;
  const entryHigh = bias === 'bullish' ? price : resistance;
  const stopLoss = bias === 'bullish' ? support - atr * 0.5 : resistance + atr * 0.5;
  const takeProfit = bias === 'bullish' ? resistance + atr : support - atr;

  const content =
    bias === 'neutral'
      ? `${symbol} shows mixed technical signals. Wait for a clearer break above ${formatPrice(resistance)} or below ${formatPrice(support)} before committing capital.`
      : `${symbol} leans ${bias} with ${confidence}% structural confidence. A disciplined approach uses ${formatPrice(support)}–${formatPrice(resistance)} as the decision zone.`;

  return {
    type: 'trade_suggestion',
    content,
    sentiment: bias,
    tradeSuggestion: {
      symbol,
      action,
      confidence,
      reasoning: content,
      why,
      entryZone: price > 0 ? { low: round2(entryLow), high: round2(entryHigh) } : undefined,
      stopLoss: price > 0 ? round2(stopLoss) : undefined,
      takeProfit: price > 0 ? round2(takeProfit) : undefined,
      timeframe: '1–3 weeks (daily chart)',
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, confidence),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildRiskAnalysis(context: AiEnrichedContext): AiAnalysisResult {
  const symbol = context.symbol ?? 'MARKET';
  const price = context.quote?.price ?? 100;
  const atr = context.atr ?? price * 0.02;
  const atrPercent = (atr / price) * 100;

  let riskScore = 40;
  if (atrPercent > 3) riskScore += 20;
  else if (atrPercent > 1.5) riskScore += 10;
  if (context.rsi?.signal === 'overbought' || context.rsi?.signal === 'oversold') riskScore += 8;
  if (context.adx !== undefined && context.adx < 20) riskScore += 5;
  if (context.overallBias === 'neutral') riskScore -= 5;
  if (context.fearGreedIndex !== undefined && context.fearGreedIndex < 25) riskScore += 10;

  riskScore = clamp(riskScore, 15, 90);

  const riskLevel =
    riskScore >= 70 ? 'high' : riskScore >= 50 ? 'medium' : riskScore >= 30 ? 'low' : 'low';

  const extreme = riskScore >= 80 ? 'extreme' : riskLevel;

  const factors: NonNullable<AiAnalysisResult['riskAnalysis']>['factors'] = [
    {
      label: 'Volatility (ATR)',
      impact: atrPercent > 2.5 ? 'negative' : 'neutral',
      detail: `Daily ATR ${formatPrice(atr)} (${formatPercent(atrPercent)} of price) — ${
        atrPercent > 2.5 ? 'elevated; widen stops or reduce size' : 'within normal range'
      }.`,
    },
    {
      label: 'Trend strength',
      impact:
        context.adx !== undefined && context.adx >= 25
          ? 'positive'
          : context.adx !== undefined && context.adx < 20
            ? 'neutral'
            : 'neutral',
      detail:
        context.adx !== undefined
          ? `ADX ${context.adx} — ${context.adx >= 25 ? 'trending market' : 'weak or ranging trend'}.`
          : 'Trend strength unavailable.',
    },
    {
      label: 'Momentum',
      impact:
        context.rsi?.signal === 'overbought'
          ? 'negative'
          : context.rsi?.signal === 'oversold'
            ? 'positive'
            : 'neutral',
      detail: context.rsi
        ? `RSI ${context.rsi.value} (${context.rsi.signal}).`
        : 'Momentum data unavailable.',
    },
    {
      label: 'Market sentiment',
      impact:
        context.fearGreedIndex !== undefined && context.fearGreedIndex < 30
          ? 'negative'
          : context.fearGreedIndex !== undefined && context.fearGreedIndex > 70
            ? 'negative'
            : 'neutral',
      detail:
        context.fearGreedIndex !== undefined
          ? `Fear & Greed Index at ${context.fearGreedIndex} (${context.fearGreedLabel ?? 'N/A'}).`
          : 'Sentiment index unavailable.',
    },
  ];

  const riskPercent = clamp(atrPercent, 0.5, 3);
  const positionSizing = `Risk 0.5–1.5% of portfolio per trade. With ATR-based stop (~${formatPercent(riskPercent)}), position size ≈ (account risk $) / (stop distance × shares).`;

  return {
    type: 'risk_analysis',
    content: `${symbol} risk score: ${riskScore}/100 (${extreme}). Volatility and momentum are the primary drivers of position sizing here.`,
    riskAnalysis: {
      symbol,
      riskScore,
      riskLevel: extreme as 'low' | 'medium' | 'high' | 'extreme',
      summary: `${symbol} presents ${riskLevel} risk. ${atrPercent > 2 ? 'Higher volatility warrants smaller positions and wider stops.' : 'Volatility is manageable for standard position sizing.'}`,
      factors,
      positionSizing,
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, 100 - Math.abs(riskScore - 50)),
  };
}

function buildPatternExplanation(
  context: AiEnrichedContext,
  requestedPattern?: string,
): AiAnalysisResult {
  const symbol = context.symbol ?? 'MARKET';
  const detected = context.detectedPatterns ?? [];
  const match =
    detected.find((p) =>
      requestedPattern ? p.name.toLowerCase().includes(requestedPattern.toLowerCase()) : false,
    ) ?? detected[0];

  const patternName = match?.name ?? requestedPattern ?? 'No clear pattern';
  const direction: AiSentiment = match
    ? match.bullish
      ? 'bullish'
      : 'bearish'
    : (context.overallBias ?? 'neutral');
  const reliability = match?.confidence ?? 45;

  const price = context.quote?.price ?? 0;
  const support = context.supportLevels?.[0];
  const resistance = context.resistanceLevels?.[0];

  const patternGuides: Record<string, string> = {
    'bullish engulfing':
      'A bullish engulfing occurs when a large green candle fully wraps the prior red candle, often signaling buyer control after a decline. Confirmation requires follow-through volume on the next session.',
    'bearish engulfing':
      'A bearish engulfing shows sellers overwhelming prior buyers. It carries more weight at resistance or after an extended rally.',
    hammer:
      'A hammer forms with a small body and long lower wick, suggesting rejection of lower prices. It is most reliable at established support with confirming volume.',
    'shooting star':
      'A shooting star has a small body and long upper wick at highs, indicating rejection of higher prices — often a warning at resistance.',
    doji:
      'A doji reflects equilibrium between buyers and sellers. Alone it is indecision; at extremes it can mark reversals when confirmed.',
    'morning star':
      'A morning star is a three-candle bullish reversal: down candle, small body star, then strong up candle. Requires support context.',
    'evening star':
      'An evening star is the bearish counterpart at highs — three candles shifting control from buyers to sellers.',
  };

  const key = patternName.toLowerCase();
  const guide =
    Object.entries(patternGuides).find(([k]) => key.includes(k))?.[1] ??
    `${patternName} is a price structure worth monitoring in context of trend and volume. Patterns are probabilistic — always confirm with levels and risk management.`;

  const keyLevels: { label: string; price: number }[] = [];
  if (resistance) keyLevels.push({ label: 'Resistance', price: resistance });
  if (support) keyLevels.push({ label: 'Support', price: support });
  if (price > 0 && resistance) {
    keyLevels.push({ label: 'Measured target', price: round2(resistance + (resistance - (support ?? price * 0.97))) });
  }

  return {
    type: 'pattern_explanation',
    content: `${patternName} on ${symbol}: ${guide}`,
    sentiment: direction,
    patternExplanation: {
      symbol,
      pattern: patternName,
      direction,
      reliability,
      explanation: guide,
      keyLevels,
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, reliability, [{ label: 'Pattern', value: patternName }]),
  };
}

function buildIndicatorExplanation(
  context: AiEnrichedContext,
  indicatorName: string,
): AiAnalysisResult {
  const symbol = context.symbol ?? 'MARKET';
  const normalized = indicatorName.toLowerCase();

  let value: number | string = 'N/A';
  let signal: AiSentiment = context.overallBias ?? 'neutral';
  let explanation = '';
  let interpretation = '';

  if (normalized.includes('rsi') && context.rsi) {
    value = context.rsi.value;
    signal =
      context.rsi.signal === 'overbought'
        ? 'bearish'
        : context.rsi.signal === 'oversold'
          ? 'bullish'
          : 'neutral';
    explanation =
      'RSI (Relative Strength Index) measures momentum on a 0–100 scale. Readings above 70 suggest overbought conditions; below 30 suggest oversold. In strong trends, RSI can remain extended — use with trend context.';
    interpretation = `RSI at ${context.rsi.value} is ${context.rsi.signal}. ${
      context.rsi.signal === 'overbought'
        ? 'Consider waiting for pullback or using tighter risk if chasing longs.'
        : context.rsi.signal === 'oversold'
          ? 'Watch for bullish reversal signals at support — not automatic buy.'
          : 'Momentum is balanced; combine with MACD and structure for conviction.'
    }`;
  } else if (normalized.includes('macd') && context.macd) {
    value = context.macd.histogram ?? 0;
    signal = context.macd.signal as AiSentiment;
    explanation =
      'MACD tracks the relationship between two EMAs. Histogram above zero with MACD above signal line supports bullish momentum; opposite for bearish.';
    interpretation = `MACD signal is ${context.macd.signal} with histogram ${context.macd.histogram}. ${
      context.macd.signal === 'bullish'
        ? 'Short-term momentum favors bulls while histogram expands.'
        : context.macd.signal === 'bearish'
          ? 'Momentum favors bears — rallies may be sold into resistance.'
          : 'MACD is flat — await crossover or histogram expansion.'
    }`;
  } else if (normalized.includes('atr') && context.atr) {
    value = context.atr;
    explanation =
      'ATR (Average True Range) measures volatility, not direction. Use it to set stop distances and position size relative to normal price movement.';
    const pct = context.quote?.price ? (context.atr / context.quote.price) * 100 : 0;
    interpretation = `ATR is ${formatPrice(context.atr)} (~${formatPercent(pct)} daily). Stops placed within 1× ATR may get noise-stopped; 1.5–2× ATR is common for swing trades.`;
  } else if (normalized.includes('adx') && context.adx !== undefined) {
    value = context.adx;
    explanation =
      'ADX measures trend strength (not direction). Below 20 = weak/ranging; 25+ = trending; 40+ = strong trend.';
    interpretation =
      context.adx >= 25
        ? `ADX ${context.adx} confirms trending conditions — trend-following strategies preferred.`
        : `ADX ${context.adx} suggests range conditions — consider mean-reversion or wait for breakout.`;
  } else if (normalized.includes('stochastic') && context.stochastic) {
    value = `K:${context.stochastic.k} D:${context.stochastic.d}`;
    signal =
      context.stochastic.k > 80 ? 'bearish' : context.stochastic.k < 20 ? 'bullish' : 'neutral';
    explanation =
      'Stochastic compares close to recent range. %K crossing %D in extreme zones can signal short-term reversals.';
    interpretation = `%K at ${context.stochastic.k}, %D at ${context.stochastic.d}. ${
      context.stochastic.k > 80
        ? 'Overbought zone — watch for bearish crossover.'
        : context.stochastic.k < 20
          ? 'Oversold zone — watch for bullish crossover at support.'
          : 'Mid-range — low conviction signal alone.'
    }`;
  } else if (context.rsi) {
    return buildIndicatorExplanation(context, 'RSI (14)');
  } else {
    explanation = `${indicatorName} requires price history. Load chart data for ${symbol} to compute live readings.`;
    interpretation =
      'Without live indicator values, rely on price action, volume, and higher-timeframe trend until data loads.';
  }

  return {
    type: 'indicator_explanation',
    content: `${indicatorName} on ${symbol}: ${interpretation}`,
    sentiment: signal,
    indicatorExplanation: {
      symbol,
      indicator: indicatorName,
      value,
      signal,
      explanation,
      interpretation,
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, context.biasConfidence ?? 60, [
      { label: 'Indicator', value: indicatorName },
    ]),
  };
}

function buildDailySummary(context: AiEnrichedContext): AiAnalysisResult {
  const sentiment = context.overallBias ?? 'neutral';
  const fg = context.fearGreedIndex;

  const highlights: string[] = [];
  if (fg !== undefined) {
    highlights.push(`Crypto Fear & Greed Index: ${fg} (${context.fearGreedLabel ?? 'N/A'})`);
  }
  if (context.newsHeadlines?.length) {
    highlights.push(`Lead headline: ${context.newsHeadlines[0].title}`);
  }
  if (context.trend && context.symbol) {
    highlights.push(`${context.symbol} trend: ${context.trend} with ${context.overallBias} bias`);
  }
  if (context.rsi) {
    highlights.push(`RSI ${context.rsi.value} — ${context.rsi.signal} momentum`);
  }
  if (highlights.length < 3) {
    highlights.push('Monitor major index levels and economic calendar for catalysts');
    highlights.push('Keep position sizes aligned with volatility (ATR-based stops)');
  }

  const summary =
    sentiment === 'bullish'
      ? 'Risk appetite is improving across key benchmarks. Leadership appears in growth-sensitive areas while defensives lag. Favor confirmed breakouts with defined risk.'
      : sentiment === 'bearish'
        ? 'Markets are under pressure with risk-off undertones. Reduce exposure to high-beta names until support stabilizes. Cash is a valid position.'
        : 'Markets are digesting mixed signals in a consolidation phase. Selectivity matters — wait for high-conviction setups rather than forcing trades.';

  return {
    type: 'daily_summary',
    content: summary,
    sentiment,
    dailySummary: {
      date: todayKey(),
      summary,
      sentiment,
      highlights,
      watchlist: ['SPY', 'QQQ', 'NVDA', 'BTC/USD'],
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, context.biasConfidence ?? 55),
  };
}

function buildMarketRecap(context: AiEnrichedContext, period: 'daily' | 'weekly'): AiAnalysisResult {
  const headlines = context.newsHeadlines ?? [];
  const summary =
    period === 'weekly'
      ? 'Weekly recap: Markets navigated macro headlines and earnings. Sector rotation and rate expectations remain the dominant narrative.'
      : `Daily recap: ${context.overallBias ?? 'neutral'} tone across benchmarks. ${context.fearGreedIndex !== undefined ? `Sentiment index at ${context.fearGreedIndex}.` : ''}`;

  return {
    type: 'market_recap',
    content: summary,
    sentiment: context.overallBias ?? 'neutral',
    marketRecap: {
      period,
      summary,
      topMovers: [
        { symbol: 'NVDA', changePercent: 2.1 },
        { symbol: 'SPY', changePercent: 0.4 },
        { symbol: 'XLE', changePercent: -0.8 },
      ],
      sectorPerformance: [
        { sector: 'Technology', changePercent: 1.2 },
        { sector: 'Financials', changePercent: 0.3 },
        { sector: 'Energy', changePercent: -0.6 },
      ],
      keyEvents: headlines.slice(0, 4).map((h) => h.title),
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, 58),
  };
}

function buildPsychologyCoach(topic: string): AiAnalysisResult {
  const lower = topic.toLowerCase();
  let advice = 'Trading success is built on process, not individual outcomes. Review your rules before each session.';
  const exercises: string[] = [];
  const mindsetTips: string[] = [
    'Separate your self-worth from your P&L',
    'Pre-define exit rules before entry',
    'Journal emotions alongside trade data',
  ];

  if (lower.includes('loss') || lower.includes('drawdown')) {
    advice =
      'Drawdowns are normal. Reduce size by 50% until you regain consistency. Never increase size to recover losses — that is revenge trading.';
    exercises.push('Write what you controlled vs. what the market did after each loss');
    exercises.push('Set a daily loss limit in dollars, not just percentage');
  } else if (lower.includes('fomo') || lower.includes('fear')) {
    advice =
      'FOMO trades rarely meet your criteria. If you missed a move, there will always be another setup. Missing a trade costs nothing; forcing a bad one costs capital.';
    exercises.push('Before entering, list 3 reasons the trade fits YOUR plan');
    exercises.push('Wait for a pullback to your predefined entry zone');
  } else if (lower.includes('discipline') || lower.includes('emotion')) {
    advice =
      'Emotional trading bypasses your edge. Use a pre-trade checklist and honor stops without exception. Consistency beats intensity.';
    exercises.push('5-minute breathing exercise before opening the platform');
    exercises.push('No new trades for 30 minutes after 2 consecutive losses');
  } else {
    exercises.push('Rate each trade 1–5 on plan adherence, not outcome');
    exercises.push('End each week with 3 process wins and 1 improvement area');
  }

  return {
    type: 'psychology_coach',
    content: advice,
    psychologyCoach: {
      topic,
      advice,
      exercises,
      mindsetTips,
    },
    generatedAt: Date.now(),
    metadata: {
      source: 'engine',
      confidence: 75,
      dataAsOf: Date.now(),
      citations: [{ label: 'Topic', value: topic }],
      modelVersion: 'tradevision-engine-1.0',
    },
  };
}

function buildPortfolioReview(
  context: AiEnrichedContext,
  holdings: AiRequestContext['portfolio'],
): AiAnalysisResult {
  const items = context.portfolioHoldings ?? holdings ?? [];
  if (items.length === 0) {
    return {
      type: 'portfolio_review',
      content: 'Add holdings to your portfolio to receive a personalized diversification and risk review.',
      portfolioReview: {
        overallHealth: 'moderate',
        diversificationScore: 0,
        summary: 'No holdings detected. Track positions in Portfolio to unlock AI portfolio review.',
        strengths: [],
        weaknesses: ['No positions tracked'],
        suggestions: ['Add your holdings with average cost basis for accurate analysis'],
      },
      generatedAt: Date.now(),
      metadata: {
        source: 'engine',
        confidence: 40,
        dataAsOf: Date.now(),
        citations: [],
        modelVersion: 'tradevision-engine-1.0',
      },
    };
  }

  const symbols = items.map((h) => h.symbol);
  const uniqueSymbols = new Set(symbols);
  const maxWeight = Math.max(
    ...items.map((h) => {
      const weight = (h as { weight?: number }).weight;
      return typeof weight === 'number' ? weight : 0;
    }),
    0,
  );
  const diversificationScore = clamp(
    Math.round((uniqueSymbols.size / items.length) * 50 + (1 - maxWeight) * 50),
    10,
    95,
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (uniqueSymbols.size >= 5) strengths.push(`${uniqueSymbols.size} distinct positions improve diversification`);
  else weaknesses.push(`Only ${uniqueSymbols.size} unique symbols — concentration risk elevated`);

  if (maxWeight > 0.25) {
    weaknesses.push(`Largest position ~${formatPercent(maxWeight * 100)} of portfolio`);
    suggestions.push('Trim any single position above 20–25% of total portfolio value');
  } else {
    strengths.push('No single position dominates the portfolio');
  }

  if (items.length < 3) suggestions.push('Consider 5–8 uncorrelated positions for smoother equity curve');

  const overallHealth =
    diversificationScore >= 70 ? 'strong' : diversificationScore >= 45 ? 'moderate' : 'weak';

  return {
    type: 'portfolio_review',
    content: `Portfolio health: ${overallHealth}. Diversification score ${diversificationScore}/100 across ${items.length} holdings.`,
    portfolioReview: {
      overallHealth,
      diversificationScore,
      summary: `${overallHealth === 'strong' ? 'Well' : overallHealth === 'moderate' ? 'Moderately' : 'Poorly'} diversified portfolio. ${maxWeight > 0.2 ? 'Address concentration in top holdings.' : 'Position sizing is reasonable.'}`,
      strengths,
      weaknesses,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : ['Rebalance quarterly', 'Review correlation between tech-heavy names'],
    },
    generatedAt: Date.now(),
    metadata: {
      source: 'engine',
      confidence: clamp(diversificationScore, 45, 85),
      dataAsOf: Date.now(),
      citations: [{ label: 'Holdings', value: String(items.length) }],
      modelVersion: 'tradevision-engine-1.0',
    },
  };
}

async function buildNewsSummary(context: AiEnrichedContext): Promise<AiAnalysisResult> {
  let headlines = context.newsHeadlines ?? [];
  if (headlines.length === 0) {
    const feed = await fetchFinancialNews({ pageSize: 6 }).catch(() => ({
      articles: [] as NewsArticle[],
      totalResults: 0,
      source: 'rss' as const,
    }));
    headlines = feed.articles.map((a) => ({ id: a.id, title: a.title, source: a.source }));
  }

  const sentiment = context.overallBias ?? 'neutral';
  const headline = headlines[0]?.title ?? 'Markets monitor macro and earnings developments';
  const keyTakeaways = headlines.slice(0, 5).map((h) => `${h.source}: ${h.title}`);

  return {
    type: 'news_summary',
    content: `News digest: ${headline}`,
    sentiment,
    newsSummary: {
      headline,
      summary: `Aggregated ${headlines.length} headlines. ${sentiment === 'bullish' ? 'Tone leans constructive.' : sentiment === 'bearish' ? 'Headlines skew cautious.' : 'Mixed narrative — verify with price action.'}`,
      sentiment,
      affectedSymbols: context.symbol ? [context.symbol] : ['SPY', 'QQQ'],
      keyTakeaways,
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, 62, [
      { label: 'Articles', value: String(headlines.length) },
    ]),
  };
}

export async function generateEngineAnalysis(
  type: AiAnalysisType,
  context: AiRequestContext,
): Promise<AiAnalysisResult> {
  const enriched = context.enriched ?? { assembledAt: Date.now() };

  switch (type) {
    case 'trade_suggestion':
      return buildTradeSuggestion(enriched);
    case 'risk_analysis':
      return buildRiskAnalysis(enriched);
    case 'pattern_explanation':
      return buildPatternExplanation(enriched, context.pattern ?? getPrimaryPattern(enriched));
    case 'indicator_explanation':
      return buildIndicatorExplanation(
        enriched,
        context.indicator ?? getPrimaryIndicator(enriched),
      );
    case 'daily_summary':
      return buildDailySummary(enriched);
    case 'market_recap':
      return buildMarketRecap(enriched, (context.timeframe as 'daily' | 'weekly') ?? 'daily');
    case 'psychology_coach':
      return buildPsychologyCoach(context.customPrompt ?? 'Trading psychology');
    case 'portfolio_review':
      return buildPortfolioReview(enriched, context.portfolio);
    case 'news_summary':
      return await buildNewsSummary(enriched);
    default:
      return {
        type,
        content: 'Analysis complete.',
        generatedAt: Date.now(),
        metadata: buildMetadata(enriched, 50),
      };
  }
}

export function generateEngineChatResponse(
  prompt: string,
  context: AiRequestContext,
): { content: string; metadata: AiAnalysisMetadata; sentiment?: AiSentiment } {
  const enriched = context.enriched;
  const symbol = context.symbol ?? enriched?.symbol;
  const lower = prompt.toLowerCase();

  if (symbol && enriched?.quote) {
    if (lower.includes('should i buy') || lower.includes('should i sell') || lower.includes('trade')) {
      const analysis = buildTradeSuggestion(enriched);
      const ts = analysis.tradeSuggestion;
      const content = [
        `**${symbol}** @ ${formatPrice(enriched.quote.price)} (${formatPercent(enriched.quote.changePercent)})`,
        '',
        analysis.content,
        '',
        '**Why (not a prediction):**',
        ...(ts?.why.map((w) => `• ${w}`) ?? []),
        '',
        ts?.entryZone
          ? `Entry zone: ${formatPrice(ts.entryZone.low)} – ${formatPrice(ts.entryZone.high)}`
          : '',
        ts?.stopLoss ? `Suggested stop: ${formatPrice(ts.stopLoss)}` : '',
        ts?.takeProfit ? `Target area: ${formatPrice(ts.takeProfit)}` : '',
        '',
        '_This is educational analysis, not financial advice._',
      ]
        .filter(Boolean)
        .join('\n');

      return {
        content,
        metadata: analysis.metadata!,
        sentiment: analysis.sentiment,
      };
    }

    if (lower.includes('rsi') || lower.includes('indicator') || lower.includes('macd')) {
      const indicator = lower.includes('macd') ? 'MACD' : lower.includes('atr') ? 'ATR' : 'RSI (14)';
      const analysis = buildIndicatorExplanation(enriched, indicator);
      return {
        content: `${analysis.indicatorExplanation?.interpretation}\n\n${analysis.indicatorExplanation?.explanation}`,
        metadata: analysis.metadata!,
        sentiment: analysis.sentiment,
      };
    }

    if (lower.includes('risk') || lower.includes('stop') || lower.includes('position size')) {
      const analysis = buildRiskAnalysis(enriched);
      const ra = analysis.riskAnalysis;
      const content = [
        ra?.summary ?? '',
        '',
        '**Risk factors:**',
        ...(ra?.factors.map((f) => `• **${f.label}**: ${f.detail}`) ?? []),
        '',
        ra?.positionSizing ?? '',
      ].join('\n');
      return { content, metadata: analysis.metadata!, sentiment: 'neutral' };
    }

    if (lower.includes('pattern')) {
      const analysis = buildPatternExplanation(enriched, getPrimaryPattern(enriched));
      return {
        content: analysis.patternExplanation?.explanation ?? analysis.content,
        metadata: analysis.metadata!,
        sentiment: analysis.sentiment,
      };
    }

    const bias = enriched.overallBias ?? 'neutral';
    const content = [
      `**${symbol}** snapshot:`,
      `• Price: ${formatPrice(enriched.quote.price)} (${formatPercent(enriched.quote.changePercent)})`,
      enriched.trend ? `• Trend: ${enriched.trend}` : '',
      enriched.rsi ? `• RSI: ${enriched.rsi.value} (${enriched.rsi.signal})` : '',
      enriched.macd ? `• MACD: ${enriched.macd.signal}` : '',
      enriched.supportLevels?.length
        ? `• Support: ${enriched.supportLevels.slice(0, 2).map((p) => formatPrice(p)).join(', ')}`
        : '',
      enriched.resistanceLevels?.length
        ? `• Resistance: ${enriched.resistanceLevels.slice(0, 2).map((p) => formatPrice(p)).join(', ')}`
        : '',
      '',
      `Overall bias: **${bias}** (${enriched.biasConfidence ?? 'N/A'}% confidence).`,
      '',
      'Ask about RSI, MACD, risk, patterns, or trade setup for deeper analysis.',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      content,
      metadata: buildMetadata(enriched, enriched.biasConfidence ?? 55),
      sentiment: bias,
    };
  }

  if (lower.includes('rsi')) {
    return {
      content:
        'RSI measures momentum (0–100). Above 70 = overbought, below 30 = oversold. In trends, RSI can stay extended — always confirm with price structure and volume.',
      metadata: {
        source: 'engine',
        confidence: 80,
        dataAsOf: Date.now(),
        citations: [{ label: 'Topic', value: 'RSI' }],
        modelVersion: 'tradevision-engine-1.0',
      },
    };
  }

  const coach = buildPsychologyCoach(prompt);
  return {
    content: coach.psychologyCoach?.advice ?? coach.content,
    metadata: coach.metadata!,
  };
}
