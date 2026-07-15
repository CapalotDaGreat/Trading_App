import { calculateRsi } from '@/features/charts/utils/indicators/rsi';
import { calculateSma } from '@/features/charts/utils/indicators/sma';
import type { Candle } from '@/shared/types/market';

function buildCandles(closes: number[]): Candle[] {
  return closes.map((close, index) => ({
    timestamp: index * 60_000,
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: 1000,
  }));
}

describe('technical indicators', () => {
  const closes = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.0, 46.03, 46.41, 46.22, 45.64];
  const candles = buildCandles(closes);

  it('calculates SMA', () => {
    const sma = calculateSma(closes, 5);
    expect(sma.length).toBeGreaterThan(0);
    expect(sma[sma.length - 1]).toBeCloseTo(46.06, 1);
  });

  it('calculates RSI within bounds', () => {
    const rsi = calculateRsi(candles, 14);
    expect(rsi.values.length).toBeGreaterThan(0);
    const last = rsi.values[rsi.values.length - 1].value;
    expect(last).toBeGreaterThanOrEqual(0);
    expect(last).toBeLessThanOrEqual(100);
  });
});
