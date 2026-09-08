import { calculateMacd } from '@/features/charts/utils/indicators/macd';
import { calculateRsi } from '@/features/charts/utils/indicators/rsi';
import { calculateSma } from '@/features/charts/utils/indicators/sma';
import type { Candle } from '@/shared/types/market';

import type {
  EducationalAnnotation,
  EducationalChartKind,
  EducationalChartModel,
} from '../types/educational-chart.types';

const DAY_MS = 86_400_000;
const BASE_TS = Date.UTC(2024, 0, 2);

function candle(
  index: number,
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
): Candle {
  return {
    timestamp: BASE_TS + index * DAY_MS,
    open,
    high,
    low,
    close,
    volume,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function padOscillator(values: Array<{ value: number }>, length: number): Array<number | null> {
  const offset = length - values.length;
  return Array.from({ length }, (_, index) => {
    if (index < offset) return null;
    return values[index - offset]?.value ?? null;
  });
}

function buildCandlesScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const candles: Candle[] = [
    candle(0, 100, 102, 99, 101, 1_200),
    candle(1, 101, 103.5, 100.2, 103, 1_400),
    candle(2, 103, 103.4, 100.4, 100.8, 1_100),
    candle(3, 100.8, 101.2, 98.6, 99.1, 1_600),
    candle(4, 99.1, 100.8, 97.4, 100.5, 1_800),
    candle(5, 100.5, 101, 99.8, 100.6, 900),
    candle(6, 100.6, 104.8, 100.4, 104.2, 2_200),
    candle(7, 104.2, 105, 102.1, 102.4, 1_700),
    candle(8, 102.4, 102.8, 99.2, 99.6, 1_900),
    candle(9, 99.6, 101.4, 99.4, 101.1, 1_200),
    candle(10, 101.1, 101.6, 100.9, 101.2, 700),
    candle(11, 101.2, 106, 101, 105.4, 2_400),
  ];
  const annotations: EducationalAnnotation[] = [
    { type: 'label', index: 1, price: 103.5, text: 'Body', tone: 'bullish' },
    { type: 'label', index: 4, price: 97.4, text: 'Lower wick', tone: 'neutral' },
    { type: 'label', index: 8, price: 99.2, text: 'Bearish close', tone: 'bearish' },
    { type: 'marker', index: 6, label: 'Wide range', tone: 'accent' },
  ];
  return { candles, annotations };
}

function buildSupportResistanceScene(): {
  candles: Candle[];
  annotations: EducationalAnnotation[];
} {
  const support = 98;
  const resistance = 108;
  const closes = [
    102, 104, 106.5, 107.6, 107.2, 105, 103, 101, 99.4, 98.6, 99.8, 102, 104.5, 107.1, 107.8, 106,
    103.5, 101.2, 99.1, 98.4, 100.2, 103, 106, 109.4, 108.2, 106.8,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 101 : closes[index - 1];
    const wick = index === 9 || index === 19 ? 1.4 : 0.7;
    const high = Math.max(open, close) + (close > resistance - 1 ? 0.4 : wick);
    const low = Math.min(open, close) - (close < support + 1.2 ? 0.3 : wick * 0.6);
    return candle(index, open, high, Math.max(96.6, low), close, 1_000 + (index % 5) * 180);
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'zone', fromPrice: 97.2, toPrice: 99.1, label: 'Support zone', tone: 'bullish' },
    { type: 'zone', fromPrice: 107.1, toPrice: 109, label: 'Resistance zone', tone: 'bearish' },
    { type: 'marker', index: 9, label: 'Hold', tone: 'bullish' },
    { type: 'marker', index: 23, label: 'Break', tone: 'warning' },
  ];
  return { candles, annotations };
}

function buildTrendScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    96, 97.2, 96.4, 98.6, 99.8, 98.9, 101.4, 102.8, 101.6, 104.2, 105.6, 104.4, 107.1, 108.4, 107.2,
    110, 111.2, 109.8, 112.6, 113.4,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 95.4 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.8,
      Math.min(open, close) - 0.5,
      close,
      1_100 + index * 40,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'marker', index: 3, label: 'HH', tone: 'bullish' },
    { type: 'marker', index: 6, label: 'HL', tone: 'bullish' },
    { type: 'marker', index: 9, label: 'HH', tone: 'bullish' },
    { type: 'marker', index: 12, label: 'HL', tone: 'bullish' },
    { type: 'hline', price: 96, label: 'Rising swing floor', tone: 'accent' },
  ];
  return { candles, annotations };
}

function buildVolumeScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    100, 100.4, 100.8, 101, 101.2, 101.1, 101.4, 103.8, 104.1, 103.6, 102.2, 101.4, 101.8, 104.6,
    105, 104.2,
  ];
  const volumes = [
    800, 820, 760, 790, 740, 700, 680, 2_400, 1_100, 900, 1_800, 1_600, 900, 2_200, 1_000, 860,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 99.8 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.5,
      Math.min(open, close) - 0.4,
      close,
      volumes[index],
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'marker', index: 7, label: 'Expansion', tone: 'accent' },
    { type: 'marker', index: 10, label: 'Contraction after', tone: 'warning' },
  ];
  return { candles, annotations };
}

function buildRsiScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    100, 101.2, 102.4, 103.8, 105.2, 106.6, 108, 109.2, 110.1, 109.4, 108.2, 106.6, 105.1, 103.8,
    102.6, 101.4, 100.2, 99.1, 98.2, 97.4, 98.6, 99.8, 101.2, 102.4, 103.1, 102.2, 101.4, 100.6,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 99.6 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.6,
      Math.min(open, close) - 0.5,
      close,
      1_200,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'marker', index: 8, label: 'Stretched advance', tone: 'warning' },
    { type: 'marker', index: 19, label: 'Washed-out pullback', tone: 'accent' },
  ];
  return { candles, annotations };
}

function buildMovingAverageScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    98, 99.1, 100.4, 101.2, 100.6, 102.4, 103.8, 104.6, 103.9, 105.8, 107.2, 108.1, 107.4, 106.1,
    104.8, 103.6, 104.4, 105.6, 107, 108.4, 109.2, 108.6,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 97.4 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.5,
      Math.min(open, close) - 0.4,
      close,
      1_000 + index * 20,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'marker', index: 11, label: 'Price above average', tone: 'bullish' },
    { type: 'marker', index: 15, label: 'Mean reversion', tone: 'warning' },
  ];
  return { candles, annotations };
}

function buildBreakoutScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    100, 101.2, 100.6, 101.8, 102.2, 101.4, 102.4, 101.9, 102.6, 102.1, 104.8, 105.2, 104.6, 103.1,
    102.4, 102.8, 105.6, 106.4, 105.8, 107.2,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 100.2 : closes[index - 1];
    const volume = index === 10 || index === 16 ? 2_600 : 900;
    return candle(
      index,
      open,
      Math.max(open, close) + (index === 10 ? 0.9 : 0.4),
      Math.min(open, close) - 0.35,
      close,
      volume,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'zone', fromPrice: 100.4, toPrice: 102.6, label: 'Range', tone: 'neutral' },
    { type: 'marker', index: 10, label: 'Break', tone: 'accent' },
    { type: 'marker', index: 13, label: 'Failed hold', tone: 'bearish' },
    { type: 'marker', index: 16, label: 'Retest / acceptance', tone: 'bullish' },
  ];
  return { candles, annotations };
}

function buildMacdScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    100, 100.6, 101.2, 101.8, 102.6, 103.4, 104.2, 105, 105.6, 105.1, 104.4, 103.6, 102.8, 102.2,
    101.8, 102.6, 103.8, 105.2, 106.4, 107.1, 106.4, 105.2, 104.1, 103.2, 104.4, 105.8, 107.2, 108.4,
    109, 108.2,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 99.8 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.5,
      Math.min(open, close) - 0.4,
      close,
      1_100,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'marker', index: 8, label: 'Impulse', tone: 'bullish' },
    { type: 'marker', index: 13, label: 'Pause', tone: 'warning' },
    { type: 'marker', index: 27, label: 'Histogram stretch', tone: 'accent' },
  ];
  return { candles, annotations };
}

function buildRiskRewardScene(): { candles: Candle[]; annotations: EducationalAnnotation[] } {
  const closes = [
    100, 100.8, 100.2, 101.4, 102.1, 101.6, 102.8, 103.4, 102.6, 101.2, 100.4, 101.8, 102.6, 103.2,
    102.4, 101.6, 102.8, 104.2, 105.1, 104.4,
  ];
  const candles = closes.map((close, index) => {
    const open = index === 0 ? 99.6 : closes[index - 1];
    return candle(
      index,
      open,
      Math.max(open, close) + 0.45,
      Math.min(open, close) - 0.4,
      close,
      1_000,
    );
  });
  const annotations: EducationalAnnotation[] = [
    { type: 'hline', price: 101.8, label: 'Entry', tone: 'accent' },
    { type: 'hline', price: 99.4, label: 'Invalidation / stop', tone: 'bearish' },
    { type: 'hline', price: 106.6, label: 'Target (about 2R)', tone: 'bullish' },
    { type: 'marker', index: 11, label: 'Decision bar', tone: 'accent' },
  ];
  return { candles, annotations };
}

const SCENE_BUILDERS: Record<
  EducationalChartKind,
  () => { candles: Candle[]; annotations: EducationalAnnotation[] }
> = {
  candles: buildCandlesScene,
  support_resistance: buildSupportResistanceScene,
  trend: buildTrendScene,
  volume: buildVolumeScene,
  rsi: buildRsiScene,
  moving_average: buildMovingAverageScene,
  breakout: buildBreakoutScene,
  macd: buildMacdScene,
  risk_reward: buildRiskRewardScene,
};

const SPOKEN: Record<EducationalChartKind, string> = {
  candles:
    'Educational example. Twelve labelled daily candles showing bodies, wicks, a wide-range bar, and both bullish and bearish closes. This is not live market data.',
  support_resistance:
    'Educational example. Price oscillating between a support zone near 98 and a resistance zone near 108, then a late break. This is not live market data.',
  trend:
    'Educational example. A sequence of higher highs and higher lows. This is not live market data.',
  volume:
    'Educational example. A quiet range, then a volume expansion on the break, then contraction. This is not live market data.',
  rsi: 'Educational example. An advance that stretches momentum, then a pullback that washes it out. RSI is shown as a teaching overlay, not a live reading.',
  moving_average:
    'Educational example. Price oscillating around a simple moving average. This is not live market data.',
  breakout:
    'Educational example. A range, a break, a failed hold, then a later retest. This is not live market data.',
  macd: 'Educational example. MACD histogram as a teaching overlay of momentum persistence. This is not live market data.',
  risk_reward:
    'Educational example. An entry, a structural invalidation, and a target about two times the risk. This is not live market data.',
};

export function buildEducationalChart(kind: EducationalChartKind): EducationalChartModel {
  const { candles, annotations } = SCENE_BUILDERS[kind]();
  const closes = candles.map((item) => item.close);

  let overlay: EducationalChartModel['overlay'] = null;
  if (kind === 'moving_average') {
    const sma = calculateSma(closes, 5);
    const offset = closes.length - sma.length;
    overlay = {
      label: 'SMA(5)',
      values: Array.from({ length: closes.length }, (_, index) =>
        index < offset ? null : sma[index - offset] ?? null,
      ),
    };
  }

  let oscillator: EducationalChartModel['oscillator'] = null;
  if (kind === 'rsi') {
    const rsi = calculateRsi(candles, 8);
    oscillator = {
      label: 'RSI(8)',
      min: 0,
      max: 100,
      values: padOscillator(rsi.values, candles.length),
      bands: [
        { value: 70, label: 'Stretched' },
        { value: 30, label: 'Washed out' },
      ],
    };
  }
  if (kind === 'macd') {
    const macd = calculateMacd(candles, 6, 13, 5);
    oscillator = {
      label: 'MACD histogram',
      min: -2,
      max: 2,
      values: padOscillator(
        macd.values.map((point) => ({ value: point.histogram })),
        candles.length,
      ),
      bands: [
        { value: 0, label: 'Zero' },
      ],
    };
  }

  return {
    kind,
    candles,
    showVolume: kind === 'volume' || kind === 'breakout',
    overlay,
    oscillator,
    annotations,
    spokenSummary: SPOKEN[kind],
  };
}

export function educationalPriceRange(candles: Candle[]): { min: number; max: number } {
  const lows = candles.map((item) => item.low);
  const highs = candles.map((item) => item.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.08 || 1;
  return { min: min - pad, max: max + pad };
}

export function clampEducationalValue(value: number, min: number, max: number): number {
  return clamp(value, min, max);
}
