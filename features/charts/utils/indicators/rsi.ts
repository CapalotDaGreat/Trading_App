import type { Candle } from '@/shared/types/market';

export interface IndicatorPoint {
  timestamp: number;
  value: number;
}

export interface RsiResult {
  values: IndicatorPoint[];
  period: number;
}

export function calculateRsi(candles: Candle[], period = 14): RsiResult {
  const values: IndicatorPoint[] = [];

  if (candles.length < period + 1) {
    return { values, period };
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const computeRsi = (gain: number, loss: number): number => {
    if (loss === 0) return 100;
    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
  };

  values.push({
    timestamp: candles[period].timestamp,
    value: computeRsi(avgGain, avgLoss),
  });

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    values.push({
      timestamp: candles[i + 1].timestamp,
      value: computeRsi(avgGain, avgLoss),
    });
  }

  return { values, period };
}
