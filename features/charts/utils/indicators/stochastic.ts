import type { Candle } from '@/shared/types/market';

export interface StochasticPoint {
  timestamp: number;
  k: number;
  d: number;
}

export interface StochasticResult {
  values: StochasticPoint[];
  kPeriod: number;
  dPeriod: number;
}

export function calculateStochastic(
  candles: Candle[],
  kPeriod = 14,
  dPeriod = 3,
): StochasticResult {
  const values: StochasticPoint[] = [];
  const kValues: number[] = [];

  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map((c) => c.high));
    const lowest = Math.min(...slice.map((c) => c.low));
    const range = highest - lowest;
    const k = range === 0 ? 50 : ((candles[i].close - lowest) / range) * 100;
    kValues.push(k);
  }

  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const dSlice = kValues.slice(i - dPeriod + 1, i + 1);
    const d = dSlice.reduce((a, b) => a + b, 0) / dPeriod;
    values.push({
      timestamp: candles[i + kPeriod - 1].timestamp,
      k: kValues[i],
      d,
    });
  }

  return { values, kPeriod, dPeriod };
}
