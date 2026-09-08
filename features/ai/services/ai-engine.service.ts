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
import { buildAiTrustPayload } from './ai-trust.service';
import {
  composeStructuredMentorAnswer,
  formatMentorAnswer,
  inferAiAnswerMode,
} from './ai-mentor-response.service';

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
  options?: {
    sentiment?: AiSentiment;
    action?: 'research' | 'watch' | 'skip';
  },
): AiAnalysisMetadata {
  const citations: AiCitation[] = [
    {
      label: 'Data as of',
      value: new Date(context.assembledAt).toLocaleString(),
      timestamp: context.assembledAt,
    },
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
  citations.push(...extraCitations);

  const trust = buildAiTrustPayload(context, {
    sentiment: options?.sentiment,
    action: options?.action,
    citations,
  });

  return {
    source: 'engine',
    confidence: trust.confidence.overall,
    dataAsOf: context.assembledAt,
    citations,
    symbol: context.symbol,
    modelVersion: 'tradevision-engine-2.0',
    trust,
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
  const price = context.quote?.price;
  const bias = context.overallBias ?? 'neutral';
  const confidence = context.biasConfidence ?? 50;

  if (price == null || price <= 0) {
    return {
      type: 'trade_suggestion',
      content:
        "I don't know the last price — no quote is attached. I will not invent a price, support, or invalidation level.",
      sentiment: 'neutral',
      tradeSuggestion: {
        symbol,
        action: 'skip',
        confidence: 0,
        reasoning: 'No usable quote. Research priority cannot be ranked from invented levels.',
        why: ['A verified last price is missing.', 'Named support/resistance were not fabricated.'],
        timeframe: 'unknown until a quote is attached',
      },
      generatedAt: Date.now(),
      metadata: buildMetadata(context, 0, [], { sentiment: 'neutral', action: 'skip' }),
    };
  }

  const support = nearestLevel(context.supportLevels ?? [], price, 'below');
  const resistance = nearestLevel(context.resistanceLevels ?? [], price, 'above');
  const atr = context.atr;

  let action: 'research' | 'watch' | 'skip' = 'watch';
  if (confidence >= 58 && bias !== 'neutral') {
    action = 'research';
  } else if (confidence < 45) {
    action = 'skip';
  }

  const researchPaths: string[] = [];
  if (confidence >= 58 && bias !== 'neutral') {
    researchPaths.push(`Research path: open ${symbol} chart → confirm MTF alignment → define invalidation before sizing.`);
  } else if (confidence >= 45) {
    researchPaths.push('Research path: add to watchlist — revisit after next daily close.');
  } else {
    researchPaths.push('Research path: skip deep dive today — time better spent on higher-conviction setups.');
  }

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
      `Recent ${top.name} pattern (${top.confidence}% detection quality) ${top.bullish ? 'has an upward technical bias if confirmed' : 'has a downward technical bias if confirmed'}.`,
    );
  }
  if (context.adx !== undefined) {
    why.push(
      context.adx >= 25
        ? `ADX at ${context.adx} confirms a trending environment — breakouts/breakdowns deserve attention.`
        : `ADX at ${context.adx} suggests a range-bound market — mean-reversion setups may outperform breakouts.`,
    );
  }
  why.push(...researchPaths);

  const hasLevels = support != null && resistance != null;
  const content = !hasLevels
    ? `${symbol} has attached technical labels, but named support/resistance are missing. I will not invent levels. ${confidence}% is evidence coverage, not a chance the market moves.`
    : bias === 'neutral'
      ? `${symbol} has mixed technical evidence. Watch for clearer structure above ${formatPrice(resistance)} or below ${formatPrice(support)} before spending more research time. Coverage is not a forecast.`
      : `${symbol} has a ${bias} technical bias with ${confidence}% evidence coverage. Use ${formatPrice(support)}–${formatPrice(resistance)} as a research zone, not a price forecast.`;

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
      observationZone: hasLevels
        ? { low: round2(Math.min(support, price)), high: round2(Math.max(resistance, price)) }
        : undefined,
      invalidationLevel:
        support != null && atr != null && bias === 'bullish'
          ? round2(support - atr * 0.5)
          : resistance != null && atr != null && bias !== 'bullish'
            ? round2(resistance + atr * 0.5)
            : undefined,
      nextResearchLevel:
        resistance != null && atr != null && bias === 'bullish'
          ? round2(resistance + atr)
          : support != null && atr != null
            ? round2(support - atr)
            : undefined,
      timeframe: '1–3 weeks (daily chart)',
    },
    generatedAt: Date.now(),
    metadata: buildMetadata(context, confidence, [], { sentiment: bias, action }),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildRiskAnalysis(context: AiEnrichedContext): AiAnalysisResult {
  const symbol = context.symbol ?? 'MARKET';
  const price = context.quote?.price;
  if (price == null || price <= 0) {
    return {
      type: 'risk_analysis',
      content:
        "I don't know the last price or ATR in usable form. I will not invent a $100 placeholder or a fake volatility percentage.",
      generatedAt: Date.now(),
      metadata: buildMetadata(context, 0, [], { action: 'skip' }),
    };
  }
  const atr = context.atr;
  const atrPercent = atr != null && atr > 0 ? (atr / price) * 100 : null;

  let riskScore = 40;
  if (atrPercent != null && atrPercent > 3) riskScore += 20;
  else if (atrPercent != null && atrPercent > 1.5) riskScore += 10;
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
      impact: atrPercent != null && atrPercent > 2.5 ? 'negative' : 'neutral',
      detail:
        atr != null && atrPercent != null
          ? `Daily ATR ${formatPrice(atr)} (${formatPercent(atrPercent)} of price) — ${
              atrPercent > 2.5 ? 'elevated; widen stops or reduce size' : 'within normal range'
            }.`
          : 'ATR is not attached. A volatility percentage was not invented.',
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

  const riskPercent = atrPercent != null ? clamp(atrPercent, 0.5, 3) : null;
  const positionSizing =
    riskPercent != null
      ? `Risk 0.5–1.5% of portfolio per trade. With ATR-based stop (~${formatPercent(riskPercent)}), position size ≈ (account risk $) / (stop distance × shares).`
      : 'Position size cannot be derived without ATR. I will not invent a stop distance.';

  return {
    type: 'risk_analysis',
    content: `${symbol} risk score: ${riskScore}/100 (${extreme}). Volatility and momentum are process inputs for research — not a forecast.`,
    riskAnalysis: {
      symbol,
      riskScore,
      riskLevel: extreme as 'low' | 'medium' | 'high' | 'extreme',
      summary: `${symbol} presents ${riskLevel} risk. ${
        atrPercent != null && atrPercent > 2
          ? 'Higher volatility warrants smaller positions and wider stops.'
          : atrPercent == null
            ? 'Volatility is unknown because ATR is missing.'
            : 'Volatility is manageable for standard position sizing.'
      }`,
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
          ? 'Watch for upward reversal evidence at support; the reading alone is not actionable.'
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
          : 'Mid-range — low-quality evidence on its own.'
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
      ? 'Risk appetite is improving across key benchmarks. Leadership appears in growth-sensitive areas while defensives lag. Prefer researching confirmed breakouts only when invalidation is defined.'
      : sentiment === 'bearish'
        ? 'Markets are under pressure with risk-off undertones. Prefer deferring high-beta research until support evidence stabilizes. Sitting out is a valid process choice.'
        : 'Markets are digesting mixed evidence in a consolidation phase. Selectivity matters — prioritize clearer research candidates.';

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
  const mode = context.answerMode ?? inferAiAnswerMode(prompt);
  const depth = context.answerDepth ?? 'balanced';
  const trust = enriched
    ? buildAiTrustPayload(enriched, { sentiment: enriched.overallBias })
    : undefined;
  const mentor = composeStructuredMentorAnswer({
    prompt,
    context,
    trust,
    mode,
    depth,
    evidenceLevel: trust?.evidenceLevel ?? 'insufficient',
    priorEvidenceLevel: context.priorEvidenceLevel,
    history: context.history,
  });
  if (trust) {
    trust.mentorAnswer = mentor;
    trust.evidenceLevel = mentor.evidenceLevel;
  }

  const content = formatMentorAnswer(mentor);
  const metadata: AiAnalysisMetadata = enriched
    ? {
        ...buildMetadata(enriched, 50, [], { sentiment: enriched.overallBias }),
        trust,
        modelVersion: 'tradevision-mentor-3.0',
      }
    : {
        source: 'engine',
        confidence: 0,
        dataAsOf: Date.now(),
        citations: [{ label: 'Topic', value: 'process' }],
        modelVersion: 'tradevision-mentor-3.0',
        trust,
      };

  return {
    content,
    metadata,
    sentiment: enriched?.overallBias,
  };
}
