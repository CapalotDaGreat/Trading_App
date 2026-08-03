import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Holding } from '@/features/portfolio/types/portfolio.types';

import type { ImpactLevel, RiskCenterSnapshot, TraderMemory } from '../types/decision.types';
import { buildTradingDna } from './setup-enrichment.service';

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
    const base = raw
      ? { ...DEFAULT_MEMORY, ...(JSON.parse(raw) as TraderMemory) }
      : { ...DEFAULT_MEMORY, updatedAt: Date.now() };
    return { ...base, dna: buildTradingDna(base) };
  } catch {
    const base = { ...DEFAULT_MEMORY, updatedAt: Date.now() };
    return { ...base, dna: buildTradingDna(base) };
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

export { buildJournalCoach } from './journal-coach.service';

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

  const diversification: ImpactLevel =
    sectorExposure.length >= 3 && maxWeight < 0.25
      ? 'low'
      : sectorExposure.length === 1 || maxWeight > 0.4
        ? 'high'
        : 'medium';

  const correlation: ImpactLevel =
    maxWeight > 0.3 || (sectorExposure[0]?.percent ?? 0) > 50 ? 'high' : 'medium';

  const healthScore = Math.max(
    5,
    Math.min(100, 100 - riskScore + (diversification === 'low' ? 15 : diversification === 'medium' ? 5 : -10)),
  );

  const recommendations = [
    maxWeight > 0.25
      ? `Largest position ~${Math.round(maxWeight * 100)}% — review concentration before new risk.`
      : 'Sizes look balanced relative to each other.',
    correlation === 'high'
      ? 'Correlation looks elevated — stress-test a risk-off day before adding same-theme names.'
      : 'Cross-asset mix is moderate.',
    'This is portfolio hygiene, not buy/sell advice.',
  ];

  const asOf = Date.now();

  return {
    riskScore,
    sectorExposure,
    cashPercent: 0,
    betaEstimate: Math.round((1 + maxWeight) * 100) / 100,
    correlation,
    recommendation: recommendations[0]!,
    holdingsCount: holdings.length,
    concentrationWarning:
      maxWeight > 0.3 ? `Single-name weight ${Math.round(maxWeight * 100)}%` : undefined,
    asOf,
    health: {
      healthScore,
      diversification,
      sectorExposure,
      cashPercent: 0,
      betaEstimate: Math.round((1 + maxWeight) * 100) / 100,
      correlation,
      concentrationWarning:
        maxWeight > 0.3 ? `Single-name weight ${Math.round(maxWeight * 100)}%` : undefined,
      stressTest:
        correlation === 'high'
          ? 'If the dominant theme drops 8–12%, portfolio drawdown would likely feel concentrated.'
          : 'A broad selloff would be absorbed more evenly across holdings.',
      recommendations,
      holdingsCount: holdings.length,
      asOf,
    },
  };
}
