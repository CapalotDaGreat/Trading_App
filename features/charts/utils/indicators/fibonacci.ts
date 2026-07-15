import type { Candle } from '@/shared/types/market';

export interface FibonacciLevel {
  ratio: number;
  label: string;
  price: number;
}

export interface FibonacciResult {
  levels: FibonacciLevel[];
  swingHigh: number;
  swingLow: number;
  direction: 'up' | 'down';
}

const FIB_RATIOS = [
  { ratio: 0, label: '0%' },
  { ratio: 0.236, label: '23.6%' },
  { ratio: 0.382, label: '38.2%' },
  { ratio: 0.5, label: '50%' },
  { ratio: 0.618, label: '61.8%' },
  { ratio: 0.786, label: '78.6%' },
  { ratio: 1, label: '100%' },
];

export function calculateFibonacci(candles: Candle[], lookback = 50): FibonacciResult {
  const slice = candles.slice(-lookback);
  const swingHigh = Math.max(...slice.map((c) => c.high));
  const swingLow = Math.min(...slice.map((c) => c.low));
  const range = swingHigh - swingLow;

  const lastClose = candles[candles.length - 1]?.close ?? 0;
  const direction: 'up' | 'down' = lastClose >= (swingHigh + swingLow) / 2 ? 'up' : 'down';

  const levels: FibonacciLevel[] = FIB_RATIOS.map(({ ratio, label }) => {
    const price =
      direction === 'up'
        ? swingHigh - range * ratio
        : swingLow + range * ratio;
    return { ratio, label, price };
  });

  return { levels, swingHigh, swingLow, direction };
}

export function calculateFibonacciExtension(
  candles: Candle[],
  lookback = 50,
): FibonacciLevel[] {
  const { swingHigh, swingLow, direction } = calculateFibonacci(candles, lookback);
  const range = swingHigh - swingLow;
  const base = direction === 'up' ? swingHigh : swingLow;

  const extensionRatios = [1.272, 1.618, 2.0, 2.618];

  return extensionRatios.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: direction === 'up' ? base + range * (ratio - 1) : base - range * (ratio - 1),
  }));
}
