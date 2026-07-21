import { apiClient } from '@/shared/services/api/api-client';
import type { Candle } from '@/shared/types/market';

export type TechnicalSignal = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export interface IndicatorValue {
  name: string;
  value: number;
  signal: TechnicalSignal;
  description: string;
}

export interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: 'weak' | 'moderate' | 'strong';
}

export interface TechnicalAnalysis {
  symbol: string;
  overallSignal: TechnicalSignal;
  score: number;
  indicators: IndicatorValue[];
  supportResistance: SupportResistance[];
  trend: 'uptrend' | 'downtrend' | 'sideways';
  summary: string;
  updatedAt: number;
  source: 'remote' | 'derived' | 'mock';
}

function computeRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeSma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsiSignal(rsi: number): TechnicalSignal {
  if (rsi < 30) return 'buy';
  if (rsi > 70) return 'sell';
  return 'neutral';
}

function maSignal(price: number, sma: number): TechnicalSignal {
  const diff = ((price - sma) / sma) * 100;
  if (diff > 2) return 'buy';
  if (diff < -2) return 'sell';
  return 'neutral';
}

function aggregateSignal(signals: TechnicalSignal[]): TechnicalSignal {
  const weights: Record<TechnicalSignal, number> = {
    strong_buy: 2,
    buy: 1,
    neutral: 0,
    sell: -1,
    strong_sell: -2,
  };
  const total = signals.reduce((sum, s) => sum + weights[s], 0);
  const avg = total / signals.length;
  if (avg >= 1.5) return 'strong_buy';
  if (avg >= 0.5) return 'buy';
  if (avg <= -1.5) return 'strong_sell';
  if (avg <= -0.5) return 'sell';
  return 'neutral';
}

function buildFromCandles(
  symbol: string,
  candles: Candle[],
  source: TechnicalAnalysis['source'] = 'derived',
): TechnicalAnalysis {
  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1] ?? 0;
  const rsi = computeRsi(closes);
  const sma20 = computeSma(closes, 20);
  const sma50 = computeSma(closes, 50);

  const indicators: IndicatorValue[] = [
    {
      name: 'RSI (14)',
      value: rsi,
      signal: rsiSignal(rsi),
      description: rsi < 30 ? 'Oversold territory' : rsi > 70 ? 'Overbought territory' : 'Neutral momentum',
    },
    {
      name: 'SMA (20)',
      value: sma20,
      signal: maSignal(price, sma20),
      description: price > sma20 ? 'Price above 20-day average' : 'Price below 20-day average',
    },
    {
      name: 'SMA (50)',
      value: sma50,
      signal: maSignal(price, sma50),
      description: price > sma50 ? 'Above 50-day trend' : 'Below 50-day trend',
    },
    {
      name: 'MACD',
      value: sma20 - sma50,
      signal: sma20 > sma50 ? 'buy' : 'sell',
      description: sma20 > sma50 ? 'Bullish crossover zone' : 'Bearish crossover zone',
    },
  ];

  const overallSignal = aggregateSignal(indicators.map((i) => i.signal));
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const recentHigh = Math.max(...highs.slice(-20));
  const recentLow = Math.min(...lows.slice(-20));

  const trend: TechnicalAnalysis['trend'] =
    price > sma50 && sma20 > sma50 ? 'uptrend' : price < sma50 && sma20 < sma50 ? 'downtrend' : 'sideways';

  return {
    symbol,
    overallSignal,
    score: Math.round(((rsi - 50) / 50 + (price > sma50 ? 0.3 : -0.3)) * 50 + 50),
    indicators,
    supportResistance: [
      { level: recentLow, type: 'support', strength: 'moderate' },
      { level: recentHigh, type: 'resistance', strength: 'moderate' },
      { level: sma50, type: price > sma50 ? 'support' : 'resistance', strength: 'strong' },
    ],
    trend,
    summary: `${symbol} is in a ${trend} with RSI at ${rsi.toFixed(1)}. The technical bias is ${signalToLabel(overallSignal).toLowerCase()}; this describes current indicators, not expected returns.`,
    updatedAt: Date.now(),
    source,
  };
}

function buildMockAnalysis(symbol: string): TechnicalAnalysis {
  const candles: Candle[] = Array.from({ length: 60 }, (_, i) => {
    const base = 150 + Math.sin(i / 8) * 10;
    return {
      timestamp: Date.now() - (60 - i) * 24 * 60 * 60 * 1000,
      open: base,
      high: base + 2,
      low: base - 2,
      close: base + (Math.random() - 0.5) * 3,
      volume: 1_000_000 + Math.random() * 500_000,
    };
  });
  return buildFromCandles(symbol, candles, 'mock');
}

export async function getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysis> {
  try {
    const analysis = await apiClient.get<TechnicalAnalysis>(`/analysis/technical/${encodeURIComponent(symbol)}`, {
      rateLimitKey: 'analysis',
    });
    return { ...analysis, source: 'remote' };
  } catch {
    try {
      const candles = await apiClient.get<Candle[]>(`/markets/${encodeURIComponent(symbol)}/candles`, {
        params: { interval: '1d', limit: 60 },
        rateLimitKey: 'analysis',
      });
      if (candles.length > 0) return buildFromCandles(symbol, candles);
    } catch {
      // fall through to mock
    }
    return buildMockAnalysis(symbol);
  }
}

export function signalToColor(signal: TechnicalSignal): string {
  switch (signal) {
    case 'strong_buy':
    case 'buy':
      return 'text-bullish';
    case 'strong_sell':
    case 'sell':
      return 'text-bearish';
    default:
      return 'text-text-secondary';
  }
}

export function signalToLabel(signal: TechnicalSignal): string {
  switch (signal) {
    case 'strong_buy':
      return 'Strong upward bias';
    case 'buy':
      return 'Upward bias';
    case 'strong_sell':
      return 'Strong downward bias';
    case 'sell':
      return 'Downward bias';
    default:
      return 'Neutral bias';
  }
}
