import type { Candle } from '@/shared/types/market';

import {
  calculateAdx,
  calculateAtr,
  calculateBollinger,
  calculateEmaSeries,
  calculateFibonacci,
  calculateIchimoku,
  calculateMacd,
  calculateRsi,
  calculateSmaSeries,
  calculateStochastic,
  calculateVwap,
  type IndicatorType,
} from '../utils/indicators';
import { detectPatterns, type PatternDetectionResult } from '../utils/pattern-detection';

export interface ChartAnalysis {
  patterns: PatternDetectionResult;
  indicators: Partial<Record<IndicatorType, unknown>>;
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  trend: string;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  supportLevels: number[];
  resistanceLevels: number[];
  recentPatterns: string[];
  overallBias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export function analyzeChart(candles: Candle[], activeIndicators: IndicatorType[] = []): ChartAnalysis {
  const patterns = detectPatterns(candles);
  const indicators: Partial<Record<IndicatorType, unknown>> = {};

  const defaultIndicators: IndicatorType[] =
    activeIndicators.length > 0
      ? activeIndicators
      : ['rsi', 'macd', 'bollinger', 'ema', 'sma'];

  for (const type of defaultIndicators) {
    switch (type) {
      case 'rsi':
        indicators.rsi = calculateRsi(candles);
        break;
      case 'macd':
        indicators.macd = calculateMacd(candles);
        break;
      case 'bollinger':
        indicators.bollinger = calculateBollinger(candles);
        break;
      case 'ema': {
        const closes = candles.map((c) => c.close);
        const timestamps = candles.map((c) => c.timestamp);
        indicators.ema = calculateEmaSeries(closes, timestamps, 20);
        break;
      }
      case 'sma': {
        const closes = candles.map((c) => c.close);
        const timestamps = candles.map((c) => c.timestamp);
        indicators.sma = calculateSmaSeries(closes, timestamps, 20);
        break;
      }
      case 'atr':
        indicators.atr = calculateAtr(candles);
        break;
      case 'adx':
        indicators.adx = calculateAdx(candles);
        break;
      case 'stochastic':
        indicators.stochastic = calculateStochastic(candles);
        break;
      case 'vwap':
        indicators.vwap = calculateVwap(candles);
        break;
      case 'ichimoku':
        indicators.ichimoku = calculateIchimoku(candles);
        break;
      case 'fibonacci':
        indicators.fibonacci = calculateFibonacci(candles);
        break;
    }
  }

  const summary = buildSummary(candles, patterns, indicators);

  return { patterns, indicators, summary };
}

function buildSummary(
  candles: Candle[],
  patterns: PatternDetectionResult,
  indicators: Partial<Record<IndicatorType, unknown>>,
): AnalysisSummary {
  const rsiData = indicators.rsi as ReturnType<typeof calculateRsi> | undefined;
  const macdData = indicators.macd as ReturnType<typeof calculateMacd> | undefined;

  const latestRsi = rsiData?.values[rsiData.values.length - 1]?.value ?? 50;
  let rsiSignal: AnalysisSummary['rsiSignal'] = 'neutral';
  if (latestRsi >= 70) rsiSignal = 'overbought';
  else if (latestRsi <= 30) rsiSignal = 'oversold';

  const latestMacd = macdData?.values[macdData.values.length - 1];
  let macdSignal: AnalysisSummary['macdSignal'] = 'neutral';
  if (latestMacd) {
    if (latestMacd.histogram > 0 && latestMacd.macd > latestMacd.signal) macdSignal = 'bullish';
    else if (latestMacd.histogram < 0 && latestMacd.macd < latestMacd.signal) macdSignal = 'bearish';
  }

  const supportLevels = patterns.supportResistance
    .filter((l) => l.type === 'support')
    .map((l) => l.price);
  const resistanceLevels = patterns.supportResistance
    .filter((l) => l.type === 'resistance')
    .map((l) => l.price);

  const recentPatterns = patterns.patterns.slice(-3).map((p) => p.pattern.replace(/_/g, ' '));

  let bullishScore = 0;
  let bearishScore = 0;

  if (patterns.trend.direction === 'uptrend') bullishScore += 2;
  else if (patterns.trend.direction === 'downtrend') bearishScore += 2;

  if (rsiSignal === 'oversold') bullishScore += 1;
  else if (rsiSignal === 'overbought') bearishScore += 1;

  if (macdSignal === 'bullish') bullishScore += 2;
  else if (macdSignal === 'bearish') bearishScore += 2;

  for (const p of patterns.patterns.slice(-3)) {
    if (p.bullish) bullishScore += 1;
    else bearishScore += 1;
  }

  const lastClose = candles[candles.length - 1]?.close ?? 0;
  const prevClose = candles[candles.length - 2]?.close ?? lastClose;
  if (lastClose > prevClose) bullishScore += 1;
  else if (lastClose < prevClose) bearishScore += 1;

  let overallBias: AnalysisSummary['overallBias'] = 'neutral';
  if (bullishScore > bearishScore + 1) overallBias = 'bullish';
  else if (bearishScore > bullishScore + 1) overallBias = 'bearish';

  const totalScore = bullishScore + bearishScore;
  const confidence = totalScore > 0 ? Math.abs(bullishScore - bearishScore) / totalScore : 0;

  return {
    trend: patterns.trend.direction,
    rsiSignal,
    macdSignal,
    supportLevels,
    resistanceLevels,
    recentPatterns,
    overallBias,
    confidence: Math.min(confidence, patterns.trend.confidence),
  };
}
