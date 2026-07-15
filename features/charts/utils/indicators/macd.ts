import type { Candle } from '@/shared/types/market';

import { calculateEma } from './ema';

export interface MacdPoint {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface MacdResult {
  values: MacdPoint[];
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export function calculateMacd(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdResult {
  const closes = candles.map((c) => c.close);
  const fastEma = calculateEma(closes, fastPeriod);
  const slowEma = calculateEma(closes, slowPeriod);

  const macdLine: { timestamp: number; value: number }[] = [];
  const offset = slowPeriod - 1;

  for (let i = 0; i < slowEma.length; i++) {
    const fastIndex = i + (slowPeriod - fastPeriod);
    if (fastIndex >= 0 && fastIndex < fastEma.length) {
      macdLine.push({
        timestamp: candles[i + offset].timestamp,
        value: fastEma[fastIndex] - slowEma[i],
      });
    }
  }

  const macdValues = macdLine.map((p) => p.value);
  const signalEma = calculateEma(macdValues, signalPeriod);

  const values: MacdPoint[] = [];
  const signalOffset = signalPeriod - 1;

  for (let i = 0; i < signalEma.length; i++) {
    const macd = macdLine[i + signalOffset];
    if (macd) {
      const signal = signalEma[i];
      values.push({
        timestamp: macd.timestamp,
        macd: macd.value,
        signal,
        histogram: macd.value - signal,
      });
    }
  }

  return { values, fastPeriod, slowPeriod, signalPeriod };
}
