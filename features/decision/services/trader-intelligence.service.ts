import AsyncStorage from '@react-native-async-storage/async-storage';

import type { JournalEntry } from '@/features/journal/types/journal.types';
import type { Holding } from '@/features/portfolio/types/portfolio.types';

import type { JournalCoachInsight, RiskCenterSnapshot, TraderMemory } from '../types/decision.types';
import { buildExplainability } from './explainability.service';

export interface MemoryProfileHints {
  favoriteAssets?: string[];
  tradingStyle?: string;
  riskTolerance?: TraderMemory['riskTolerance'];
}

const MEMORY_KEY = 'tradevision-trader-memory';

const DEFAULT_MEMORY: TraderMemory = {
  favoriteAssets: ['SPY', 'NVDA', 'BTC/USD'],
  tradingStyle: 'swing',
  riskTolerance: 'moderate',
  avgHoldHint: 'Multi-day swings',
  typicalMistakes: ['Moving stops after losses', 'Oversizing breakouts'],
  favoriteIndicators: ['RSI', 'EMA', 'VWAP'],
  bestSetups: ['Pullback with trend'],
  weakestSetups: ['Counter-trend breakout chase'],
  notes: ['Prefer waiting for confirmation when ADX is low'],
  updatedAt: Date.now(),
};

export async function loadTraderMemory(): Promise<TraderMemory> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_KEY);
    if (!raw) return { ...DEFAULT_MEMORY, updatedAt: Date.now() };
    return { ...DEFAULT_MEMORY, ...(JSON.parse(raw) as TraderMemory) };
  } catch {
    return { ...DEFAULT_MEMORY, updatedAt: Date.now() };
  }
}

export async function saveTraderMemory(patch: Partial<TraderMemory>): Promise<TraderMemory> {
  const current = await loadTraderMemory();
  const next: TraderMemory = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  return next;
}

export async function syncMemoryFromProfile(
  profile?: MemoryProfileHints | null,
  holdings?: Holding[],
): Promise<TraderMemory> {
  const favorites =
    holdings && holdings.length > 0
      ? holdings.slice(0, 5).map((h) => h.symbol)
      : (profile?.favoriteAssets ?? DEFAULT_MEMORY.favoriteAssets);

  return saveTraderMemory({
    favoriteAssets: favorites,
    tradingStyle: profile?.tradingStyle ?? DEFAULT_MEMORY.tradingStyle,
    riskTolerance: profile?.riskTolerance ?? DEFAULT_MEMORY.riskTolerance,
  });
}

export function buildJournalCoach(entries: JournalEntry[]): JournalCoachInsight {
  const closed = entries.filter((e) => e.outcome !== 'open' && e.pnl !== undefined);
  const wins = closed.filter((e) => (e.pnl ?? 0) > 0);
  const losses = closed.filter((e) => (e.pnl ?? 0) < 0);
  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : 0;

  const avgWin =
    wins.length > 0 ? wins.reduce((s, e) => s + Math.abs(e.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((s, e) => s + Math.abs(e.pnl ?? 0), 0) / losses.length : 1;
  const avgRr = avgLoss > 0 ? Math.round((avgWin / avgLoss) * 10) / 10 : 0;

  const weekdayCounts = new Map<string, { w: number; t: number }>();
  for (const e of closed) {
    const day = new Date(e.tradedAt).toLocaleDateString('en-US', { weekday: 'long' });
    const cur = weekdayCounts.get(day) ?? { w: 0, t: 0 };
    cur.t += 1;
    if ((e.pnl ?? 0) > 0) cur.w += 1;
    weekdayCounts.set(day, cur);
  }
  let bestWeekday = 'Tuesday';
  let bestRate = -1;
  for (const [day, v] of weekdayCounts) {
    const rate = v.t ? v.w / v.t : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestWeekday = day;
    }
  }

  const notes = closed.map((e) => (e.notes ?? '').toLowerCase()).join(' ');
  const movedStops = /stop/.test(notes);
  const mostCommonMistake = movedStops
    ? 'Moving stops after adverse moves'
    : losses.length > wins.length
      ? 'Entering without clear invalidation'
      : 'Overtrading after wins';

  const processScore = Math.min(
    95,
    Math.max(40, Math.round(winRate * 0.5 + Math.min(avgRr, 3) * 12 + (movedStops ? -8 : 10))),
  );

  const asOf = Date.now();
  return {
    winRate,
    avgRr,
    mostCommonMistake,
    bestWeekday,
    worstCondition: 'Low-ADX breakouts',
    bestIndicator: 'VWAP + trend EMA',
    psychology:
      losses.length >= 2
        ? 'Fear after consecutive losses is elevating risk of stop-moves.'
        : 'Maintain process discipline after wins — avoid size creep.',
    edge: 'Momentum continuation / pullbacks with trend',
    avoid: 'Breakout chasing in ranging regimes',
    recommendation:
      closed.length < 5
        ? 'Log more closed trades so coach insights become personal rather than defaults.'
        : 'Prioritize pullback continuation setups; skip low-ADX breakouts this week.',
    processScore,
    explainability: buildExplainability({
      confidence: processScore,
      factors: [
        { label: 'Sample size', agrees: closed.length >= 5, detail: `${closed.length} closed trades` },
        { label: 'Win rate', agrees: winRate >= 50, detail: `${winRate}%` },
        { label: 'RR', agrees: avgRr >= 1.5, detail: `${avgRr}` },
      ],
      dataAsOf: asOf,
      reasoning: 'Coach insights derived from your journal outcomes and note patterns — process over P&L.',
    }),
  };
}

export function buildRiskCenter(holdings: Holding[]): RiskCenterSnapshot {
  if (!holdings.length) {
    return {
      riskScore: 20,
      sectorExposure: [{ label: 'Cash', percent: 100 }],
      cashPercent: 100,
      betaEstimate: 0,
      correlation: 'low',
      recommendation: 'Add tracked holdings to unlock concentration and risk insights.',
      holdingsCount: 0,
      asOf: Date.now(),
    };
  }

  const values = holdings.map((h) => Math.abs(h.quantity * h.currentPrice));
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const weights = holdings.map((h, i) => ({
    symbol: h.symbol,
    weight: values[i] / total,
  }));
  const maxWeight = Math.max(...weights.map((w) => w.weight));

  const sectors = new Map<string, number>();
  for (const h of holdings) {
    const key =
      h.marketType === 'crypto'
        ? 'Crypto'
        : h.marketType === 'forex'
          ? 'FX'
          : h.marketType === 'commodities'
            ? 'Commodities'
            : h.marketType === 'indices'
              ? 'Indices'
              : 'Equities / ETF';
    sectors.set(key, (sectors.get(key) ?? 0) + Math.abs(h.quantity * h.currentPrice) / total);
  }

  const sectorExposure = [...sectors.entries()]
    .map(([label, percent]) => ({ label, percent: Math.round(percent * 100) }))
    .sort((a, b) => b.percent - a.percent);

  const riskScore = Math.min(
    95,
    Math.round(35 + maxWeight * 100 + (sectorExposure[0]?.percent ?? 0) * 0.3),
  );

  return {
    riskScore,
    sectorExposure,
    cashPercent: 0,
    betaEstimate: Math.round((1 + maxWeight) * 100) / 100,
    correlation: maxWeight > 0.3 || (sectorExposure[0]?.percent ?? 0) > 50 ? 'high' : 'medium',
    recommendation:
      maxWeight > 0.25
        ? `Largest position is ~${Math.round(maxWeight * 100)}% — consider trimming concentration.`
        : 'Position sizes look balanced. Revisit when adding correlated tech/crypto names.',
    holdingsCount: holdings.length,
    concentrationWarning:
      maxWeight > 0.3 ? `Single-name weight ${Math.round(maxWeight * 100)}%` : undefined,
    asOf: Date.now(),
  };
}
