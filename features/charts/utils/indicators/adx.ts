import type { Candle } from '@/shared/types/market';

export interface AdxPoint {
  timestamp: number;
  adx: number;
  plusDi: number;
  minusDi: number;
}

export interface AdxResult {
  values: AdxPoint[];
  period: number;
}

function smoothWilder(values: number[], period: number): number[] {
  const result: number[] = [];
  let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
  result.push(sum);

  for (let i = period; i < values.length; i++) {
    sum = sum - sum / period + values[i];
    result.push(sum);
  }

  return result;
}

export function calculateAdx(candles: Candle[], period = 14): AdxResult {
  const values: AdxPoint[] = [];

  if (candles.length < period * 2) {
    return { values, period };
  }

  const plusDm: number[] = [];
  const minusDm: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  const smoothTr = smoothWilder(tr, period);
  const smoothPlusDm = smoothWilder(plusDm, period);
  const smoothMinusDm = smoothWilder(minusDm, period);

  const dxValues: number[] = [];

  for (let i = 0; i < smoothTr.length; i++) {
    const plusDi = smoothTr[i] === 0 ? 0 : (100 * smoothPlusDm[i]) / smoothTr[i];
    const minusDi = smoothTr[i] === 0 ? 0 : (100 * smoothMinusDm[i]) / smoothTr[i];
    const diSum = plusDi + minusDi;
    const dx = diSum === 0 ? 0 : (100 * Math.abs(plusDi - minusDi)) / diSum;
    dxValues.push(dx);
  }

  if (dxValues.length < period) {
    return { values, period };
  }

  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const offset = period * 2 - 1;

  values.push({
    timestamp: candles[offset].timestamp,
    adx,
    plusDi: smoothTr[period - 1] === 0 ? 0 : (100 * smoothPlusDm[period - 1]) / smoothTr[period - 1],
    minusDi: smoothTr[period - 1] === 0 ? 0 : (100 * smoothMinusDm[period - 1]) / smoothTr[period - 1],
  });

  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
    values.push({
      timestamp: candles[i + period].timestamp,
      adx,
      plusDi: smoothTr[i] === 0 ? 0 : (100 * smoothPlusDm[i]) / smoothTr[i],
      minusDi: smoothTr[i] === 0 ? 0 : (100 * smoothMinusDm[i]) / smoothTr[i],
    });
  }

  return { values, period };
}
