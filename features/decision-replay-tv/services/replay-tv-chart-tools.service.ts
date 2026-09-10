import { calculateRsi } from '@/features/charts/utils/indicators/rsi';
import { calculateSma } from '@/features/charts/utils/indicators/sma';
import type { Candle } from '@/shared/types/market';

export type ReplayTapeTimeframe = '1d' | '1w';
export type ReplayTapeOverlay = 'none' | 'sma10' | 'rsi14';

/** Weekly bars from the visible slice only — never pulls unseen daily bars. */
export function resampleVisibleCandles(candles: Candle[], timeframe: ReplayTapeTimeframe): Candle[] {
  if (timeframe === '1d' || candles.length < 5) return candles;
  const weeks: Candle[] = [];
  for (let i = 0; i < candles.length; i += 5) {
    const slice = candles.slice(i, i + 5);
    const first = slice[0]!;
    const last = slice[slice.length - 1]!;
    weeks.push({
      timestamp: last.timestamp,
      open: first.open,
      high: Math.max(...slice.map((item) => item.high)),
      low: Math.min(...slice.map((item) => item.low)),
      close: last.close,
      volume: slice.reduce((sum, item) => sum + item.volume, 0),
    });
  }
  return weeks;
}

export function visibleSma(candles: Candle[], period = 10): number | null {
  if (candles.length < period) return null;
  const series = calculateSma(
    candles.map((item) => item.close),
    period,
  );
  return series[series.length - 1] ?? null;
}

export function visibleRsi(candles: Candle[], period = 14): number | null {
  if (candles.length <= period) return null;
  const result = calculateRsi(candles, period);
  return result.values[result.values.length - 1]?.value ?? null;
}

export function measureRange(high: number, low: number): { distance: number; percent: number } {
  const distance = Math.abs(high - low);
  const base = Math.min(high, low) || 1;
  return { distance, percent: (distance / base) * 100 };
}

export function overlayUsesOnly(candles: Candle[], full: Candle[], cutoff: number): boolean {
  const lastVisible = candles[candles.length - 1]?.timestamp ?? 0;
  const future = full.slice(cutoff + 1);
  return !future.some((bar) => bar.timestamp <= lastVisible);
}
