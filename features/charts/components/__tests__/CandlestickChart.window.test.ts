import {
  MIN_CANDLE_BAR_WIDTH,
  windowVisibleCandles,
} from '@/features/charts/components/CandlestickChart';
import type { Candle } from '@/shared/types/market';

function candle(i: number): Candle {
  return {
    timestamp: i * 60_000,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100.5 + i,
    volume: 1000,
  };
}

describe('windowVisibleCandles', () => {
  it('returns all candles when they fit the viewport', () => {
    const candles = Array.from({ length: 10 }, (_, i) => candle(i));
    expect(windowVisibleCandles(candles, 400)).toHaveLength(10);
  });

  it('keeps only trailing candles that fit at the minimum bar width', () => {
    const candles = Array.from({ length: 200 }, (_, i) => candle(i));
    const width = 200;
    const visible = windowVisibleCandles(candles, width);
    const chartWidth = width - 8 - 56;
    const maxCandles = Math.max(1, Math.floor(chartWidth / (MIN_CANDLE_BAR_WIDTH + 2)));
    expect(visible.length).toBe(maxCandles);
    expect(visible[visible.length - 1]?.timestamp).toBe(candles[candles.length - 1]?.timestamp);
  });

  it('bounds rendered candle count for typical phone widths', () => {
    const candles = Array.from({ length: 500 }, (_, i) => candle(i));
    expect(windowVisibleCandles(candles, 360).length).toBeLessThanOrEqual(80);
  });
});
