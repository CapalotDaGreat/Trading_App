import type { Candle } from '@/shared/types/market';

export interface IchimokuPoint {
  timestamp: number;
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
}

export interface IchimokuResult {
  values: IchimokuPoint[];
  tenkanPeriod: number;
  kijunPeriod: number;
  senkouBPeriod: number;
}

function midpoint(candles: Candle[], endIndex: number, period: number): number {
  const start = Math.max(0, endIndex - period + 1);
  const slice = candles.slice(start, endIndex + 1);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  return (high + low) / 2;
}

export function calculateIchimoku(
  candles: Candle[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
): IchimokuResult {
  const values: IchimokuPoint[] = [];
  const minPeriod = Math.max(tenkanPeriod, kijunPeriod, senkouBPeriod);

  for (let i = minPeriod - 1; i < candles.length; i++) {
    const tenkan = midpoint(candles, i, tenkanPeriod);
    const kijun = midpoint(candles, i, kijunPeriod);
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = midpoint(candles, i, senkouBPeriod);
    const chikou = candles[Math.max(0, i - kijunPeriod)]?.close ?? candles[i].close;

    values.push({
      timestamp: candles[i].timestamp,
      tenkan,
      kijun,
      senkouA,
      senkouB,
      chikou,
    });
  }

  return { values, tenkanPeriod, kijunPeriod, senkouBPeriod };
}
