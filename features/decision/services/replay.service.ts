import type { Candle, CandleInterval } from '@/shared/types/market';

import { analyzeChart } from '@/features/charts/services/chart-analysis.service';

export interface ReplayFrame {
  index: number;
  asOf: number;
  visibleCandles: Candle[];
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  note: string;
}

export interface ReplaySession {
  symbol: string;
  interval: CandleInterval;
  frames: ReplayFrame[];
  totalBars: number;
}

/** Build a bar-by-bar replay of historical candles with live analysis at each step. */
export function buildChartReplay(
  symbol: string,
  candles: Candle[],
  interval: CandleInterval,
  minBars = 40,
): ReplaySession {
  const sorted = [...candles].sort((a, b) => a.timestamp - b.timestamp);
  const frames: ReplayFrame[] = [];

  for (let i = minBars; i < sorted.length; i += Math.max(1, Math.floor((sorted.length - minBars) / 24))) {
    const visible = sorted.slice(0, i + 1);
    const analysis = analyzeChart(visible);
    frames.push({
      index: i,
      asOf: visible[visible.length - 1]?.timestamp ?? Date.now(),
      visibleCandles: visible,
      bias: analysis.summary.overallBias,
      confidence: Math.round(analysis.summary.confidence * 100),
      note: `${analysis.summary.trend} · RSI ${analysis.summary.rsiSignal} · MACD ${analysis.summary.macdSignal}`,
    });
  }

  if (!frames.length && sorted.length >= minBars) {
    const visible = sorted;
    const analysis = analyzeChart(visible);
    frames.push({
      index: sorted.length - 1,
      asOf: visible[visible.length - 1]?.timestamp ?? Date.now(),
      visibleCandles: visible,
      bias: analysis.summary.overallBias,
      confidence: Math.round(analysis.summary.confidence * 100),
      note: analysis.summary.trend,
    });
  }

  return {
    symbol,
    interval,
    frames,
    totalBars: sorted.length,
  };
}
