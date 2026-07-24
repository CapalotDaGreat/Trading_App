import { analyzeChart } from '@/features/charts/services/chart-analysis.service';
import type { Candle, CandleInterval } from '@/shared/types/market';
import type { MarketRegime, TraderMemory } from '@/features/decision/types/decision.types';

import type {
  SimulatorContextPack,
  SimulatorSession,
} from '../types/simulator.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function id(): string {
  return `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Pick a freeze point that leaves meaningful history and a reveal window.
 * Future candles stay in `fullCandles` / `futureCandles` — never shown until reveal.
 */
export function pickFreezeIndex(candleCount: number, minHistory = 48, minFuture = 12): number {
  if (candleCount < minHistory + minFuture) {
    return Math.max(20, candleCount - Math.max(5, Math.floor(candleCount * 0.2)) - 1);
  }
  const latestSafe = candleCount - minFuture - 1;
  const earliest = minHistory;
  // Prefer ~70% through the safe window so reveal has room to teach.
  return Math.min(latestSafe, Math.max(earliest, Math.floor(earliest + (latestSafe - earliest) * 0.7)));
}

export function sliceSimulatorCandles(fullCandles: Candle[], freezeIndex: number) {
  const sorted = [...fullCandles].sort((a, b) => a.timestamp - b.timestamp);
  const safeIndex = Math.max(0, Math.min(freezeIndex, sorted.length - 1));
  return {
    sorted,
    freezeIndex: safeIndex,
    visibleCandles: sorted.slice(0, safeIndex + 1),
    futureCandles: sorted.slice(safeIndex + 1),
  };
}

export function buildSimulatorContext(input: {
  visibleCandles: Candle[];
  regimeLabel?: string;
  regime?: MarketRegime;
  newsHeadlines?: { id: string; title: string; source: string }[];
  portfolioSymbols?: string[];
  symbol: string;
  memory?: TraderMemory | null;
  researchTimeMinutes: number;
}): SimulatorContextPack {
  const analysis =
    input.visibleCandles.length >= 20 ? analyzeChart(input.visibleCandles) : null;
  const held = (input.portfolioSymbols ?? []).some(
    (s) => s.toUpperCase() === input.symbol.toUpperCase(),
  );

  return {
    indicatorsNote: analysis
      ? `${analysis.summary.trend} · RSI ${analysis.summary.rsiSignal} · MACD ${analysis.summary.macdSignal}`
      : 'Insufficient bars for indicator summary on the visible window.',
    bias: analysis?.summary.overallBias ?? 'neutral',
    evidenceQuality: analysis ? clamp(analysis.summary.confidence * 100) : 35,
    newsHeadlines: (input.newsHeadlines ?? []).slice(0, 4),
    regimeLabel: input.regimeLabel ?? 'Unknown',
    regime: input.regime,
    portfolioNote: held
      ? `${input.symbol} is already in your tracked portfolio — research may add less new edge.`
      : `${input.symbol} is not in your tracked holdings — attention is a scarce resource.`,
    researchTimeMinutes: input.researchTimeMinutes,
    memoryNote: input.memory?.typicalMistakes?.[0]
      ? `Personal leak to watch: ${input.memory.typicalMistakes[0]}`
      : input.memory?.tradingStyle
        ? `Your style cue: ${input.memory.tradingStyle}`
        : undefined,
  };
}

export function createSimulatorSession(input: {
  symbol: string;
  interval: CandleInterval;
  candles: Candle[];
  regimeLabel?: string;
  regime?: MarketRegime;
  newsHeadlines?: { id: string; title: string; source: string }[];
  portfolioSymbols?: string[];
  memory?: TraderMemory | null;
  researchTimeMinutes?: number;
}): SimulatorSession {
  const { sorted, freezeIndex, visibleCandles, futureCandles } = sliceSimulatorCandles(
    input.candles,
    pickFreezeIndex(input.candles.length),
  );

  if (visibleCandles.length < 20) {
    throw new Error('Not enough candle history to run a Decision Simulator session.');
  }

  const context = buildSimulatorContext({
    visibleCandles,
    regimeLabel: input.regimeLabel,
    regime: input.regime,
    newsHeadlines: input.newsHeadlines,
    portfolioSymbols: input.portfolioSymbols,
    symbol: input.symbol,
    memory: input.memory,
    researchTimeMinutes: input.researchTimeMinutes ?? 15,
  });

  return {
    id: id(),
    symbol: input.symbol.toUpperCase(),
    interval: input.interval,
    fullCandles: sorted,
    freezeIndex,
    visibleCandles,
    futureCandles,
    context,
    phase: 'deciding',
    checklist: {
      reviewedIndicators: false,
      notedRegime: false,
      consideredPortfolio: false,
      setInvalidationThought: false,
      respectedTimeBudget: true,
    },
    createdAt: Date.now(),
  };
}
