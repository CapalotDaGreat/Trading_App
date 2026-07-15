import type { Candle } from '@/shared/types/market';

import { calculateSma } from './sma';

export interface BollingerPoint {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface BollingerResult {
  values: BollingerPoint[];
  period: number;
  stdDevMultiplier: number;
}

function standardDeviation(values: number[], mean: number): number {
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateBollinger(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerResult {
  const closes = candles.map((c) => c.close);
  const sma = calculateSma(closes, period);
  const values: BollingerPoint[] = [];

  for (let i = 0; i < sma.length; i++) {
    const slice = closes.slice(i, i + period);
    const std = standardDeviation(slice, sma[i]);
    values.push({
      timestamp: candles[i + period - 1].timestamp,
      upper: sma[i] + stdDevMultiplier * std,
      middle: sma[i],
      lower: sma[i] - stdDevMultiplier * std,
    });
  }

  return { values, period, stdDevMultiplier };
}
