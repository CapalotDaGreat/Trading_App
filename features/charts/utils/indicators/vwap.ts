import type { Candle } from '@/shared/types/market';

export interface VwapPoint {
  timestamp: number;
  value: number;
}

export interface VwapResult {
  values: VwapPoint[];
}

export function calculateVwap(candles: Candle[]): VwapResult {
  const values: VwapPoint[] = [];
  let cumulativeTpVolume = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTpVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    const vwap = cumulativeVolume === 0 ? typicalPrice : cumulativeTpVolume / cumulativeVolume;
    values.push({ timestamp: candle.timestamp, value: vwap });
  }

  return { values };
}
