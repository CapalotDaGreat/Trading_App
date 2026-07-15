import type { Candle } from '@/shared/types/market';

export interface AtrPoint {
  timestamp: number;
  value: number;
}

export interface AtrResult {
  values: AtrPoint[];
  period: number;
}

export function calculateAtr(candles: Candle[], period = 14): AtrResult {
  const values: AtrPoint[] = [];

  if (candles.length < period + 1) {
    return { values, period };
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  values.push({ timestamp: candles[period].timestamp, value: atr });

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    values.push({ timestamp: candles[i + 1].timestamp, value: atr });
  }

  return { values, period };
}
