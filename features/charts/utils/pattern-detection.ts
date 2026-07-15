import type { Candle } from '@/shared/types/market';

export type TrendDirection = 'uptrend' | 'downtrend' | 'sideways';

export interface SupportResistanceLevel {
  price: number;
  strength: number;
  type: 'support' | 'resistance';
  touches: number;
}

export interface TrendLine {
  direction: TrendDirection;
  slope: number;
  startPrice: number;
  endPrice: number;
  confidence: number;
}

export type CandlestickPattern =
  | 'doji'
  | 'hammer'
  | 'shooting_star'
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'morning_star'
  | 'evening_star';

export interface PatternMatch {
  pattern: CandlestickPattern;
  timestamp: number;
  index: number;
  bullish: boolean;
  confidence: number;
}

export interface PatternDetectionResult {
  supportResistance: SupportResistanceLevel[];
  trend: TrendLine;
  patterns: PatternMatch[];
}

function clusterLevels(prices: number[], tolerance: number): { price: number; touches: number }[] {
  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: { price: number; touches: number }[] = [];

  for (const price of sorted) {
    const existing = clusters.find((c) => Math.abs(c.price - price) / c.price < tolerance);
    if (existing) {
      existing.price = (existing.price * existing.touches + price) / (existing.touches + 1);
      existing.touches += 1;
    } else {
      clusters.push({ price, touches: 1 });
    }
  }

  return clusters.sort((a, b) => b.touches - a.touches);
}

export function detectSupportResistance(
  candles: Candle[],
  lookback = 50,
  tolerance = 0.005,
): SupportResistanceLevel[] {
  const slice = candles.slice(-lookback);
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  for (let i = 2; i < slice.length - 2; i++) {
    const c = slice[i];
    if (c.high > slice[i - 1].high && c.high > slice[i - 2].high && c.high > slice[i + 1].high && c.high > slice[i + 2].high) {
      pivotHighs.push(c.high);
    }
    if (c.low < slice[i - 1].low && c.low < slice[i - 2].low && c.low < slice[i + 1].low && c.low < slice[i + 2].low) {
      pivotLows.push(c.low);
    }
  }

  const resistanceClusters = clusterLevels(pivotHighs, tolerance);
  const supportClusters = clusterLevels(pivotLows, tolerance);

  const levels: SupportResistanceLevel[] = [
    ...resistanceClusters.slice(0, 3).map((c) => ({
      price: c.price,
      strength: Math.min(c.touches / 5, 1),
      type: 'resistance' as const,
      touches: c.touches,
    })),
    ...supportClusters.slice(0, 3).map((c) => ({
      price: c.price,
      strength: Math.min(c.touches / 5, 1),
      type: 'support' as const,
      touches: c.touches,
    })),
  ];

  return levels.sort((a, b) => b.strength - a.strength);
}

export function detectTrend(candles: Candle[], period = 20): TrendLine {
  const slice = candles.slice(-period);
  if (slice.length < 2) {
    return { direction: 'sideways', slope: 0, startPrice: 0, endPrice: 0, confidence: 0 };
  }

  const n = slice.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += slice[i].close;
    sumXY += i * slice[i].close;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const startPrice = intercept;
  const endPrice = intercept + slope * (n - 1);

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssTot += (slice[i].close - meanY) ** 2;
    ssRes += (slice[i].close - predicted) ** 2;
  }

  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const slopePercent = (slope / meanY) * 100;

  let direction: TrendDirection = 'sideways';
  if (slopePercent > 0.1) direction = 'uptrend';
  else if (slopePercent < -0.1) direction = 'downtrend';

  return {
    direction,
    slope,
    startPrice,
    endPrice,
    confidence: Math.max(0, Math.min(1, rSquared)),
  };
}

function bodySize(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function isBullish(c: Candle): boolean {
  return c.close > c.open;
}

export function detectCandlestickPatterns(candles: Candle[]): PatternMatch[] {
  const patterns: PatternMatch[] = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const body = bodySize(curr);
    const range = curr.high - curr.low;

    if (range === 0) continue;

    const bodyRatio = body / range;
    const lowerShadow = Math.min(curr.open, curr.close) - curr.low;
    const upperShadow = curr.high - Math.max(curr.open, curr.close);

    if (bodyRatio < 0.1) {
      patterns.push({
        pattern: 'doji',
        timestamp: curr.timestamp,
        index: i,
        bullish: true,
        confidence: 0.7,
      });
    }

    if (lowerShadow > body * 2 && upperShadow < body * 0.5 && bodyRatio < 0.35) {
      patterns.push({
        pattern: 'hammer',
        timestamp: curr.timestamp,
        index: i,
        bullish: true,
        confidence: 0.75,
      });
    }

    if (upperShadow > body * 2 && lowerShadow < body * 0.5 && bodyRatio < 0.35) {
      patterns.push({
        pattern: 'shooting_star',
        timestamp: curr.timestamp,
        index: i,
        bullish: false,
        confidence: 0.75,
      });
    }

    if (!isBullish(prev) && isBullish(curr) && curr.open <= prev.close && curr.close >= prev.open) {
      patterns.push({
        pattern: 'bullish_engulfing',
        timestamp: curr.timestamp,
        index: i,
        bullish: true,
        confidence: 0.8,
      });
    }

    if (isBullish(prev) && !isBullish(curr) && curr.open >= prev.close && curr.close <= prev.open) {
      patterns.push({
        pattern: 'bearish_engulfing',
        timestamp: curr.timestamp,
        index: i,
        bullish: false,
        confidence: 0.8,
      });
    }

    if (i >= 2) {
      const first = candles[i - 2];
      const mid = candles[i - 1];
      const last = candles[i];

      if (
        !isBullish(first) &&
        bodySize(mid) < bodySize(first) * 0.3 &&
        isBullish(last) &&
        last.close > (first.open + first.close) / 2
      ) {
        patterns.push({
          pattern: 'morning_star',
          timestamp: last.timestamp,
          index: i,
          bullish: true,
          confidence: 0.85,
        });
      }

      if (
        isBullish(first) &&
        bodySize(mid) < bodySize(first) * 0.3 &&
        !isBullish(last) &&
        last.close < (first.open + first.close) / 2
      ) {
        patterns.push({
          pattern: 'evening_star',
          timestamp: last.timestamp,
          index: i,
          bullish: false,
          confidence: 0.85,
        });
      }
    }
  }

  return patterns.slice(-10);
}

export function detectPatterns(candles: Candle[]): PatternDetectionResult {
  return {
    supportResistance: detectSupportResistance(candles),
    trend: detectTrend(candles),
    patterns: detectCandlestickPatterns(candles),
  };
}
