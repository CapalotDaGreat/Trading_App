import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AiChangeDriverDetail,
  AiConfidenceHistoryPoint,
  AiRecommendationSnapshot,
  AiWhyChanged,
} from '../types/ai-trust.types';

const HISTORY_KEY = 'tradevision-ai-recommendation-history-v1';
const MAX_PER_SYMBOL = 12;

interface HistoryStore {
  [symbol: string]: AiRecommendationSnapshot[];
}

async function loadStore(): Promise<HistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryStore) : {};
  } catch {
    return {};
  }
}

async function saveStore(store: HistoryStore): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(store));
}

function summarizeSnapshot(s: AiRecommendationSnapshot): string {
  const action = s.action ?? 'watch';
  const bias = s.bias ?? 'neutral';
  return `${action} · ${bias} · quality ${s.overallConfidence}%`;
}

function diffDrivers(
  prev: AiRecommendationSnapshot,
  curr: AiRecommendationSnapshot,
): AiChangeDriverDetail[] {
  const drivers: AiChangeDriverDetail[] = [];

  if (
    prev.rsi != null &&
    curr.rsi != null &&
    Math.abs(prev.rsi - curr.rsi) >= 5
  ) {
    drivers.push({
      driver: 'indicator',
      label: 'Indicator change',
      detail: `RSI moved ${prev.rsi.toFixed(0)} → ${curr.rsi.toFixed(0)}.`,
    });
  }
  if (
    prev.adx != null &&
    curr.adx != null &&
    Math.abs(prev.adx - curr.adx) >= 4
  ) {
    drivers.push({
      driver: 'volatility',
      label: 'Trend-strength change',
      detail: `ADX moved ${prev.adx.toFixed(0)} → ${curr.adx.toFixed(0)}.`,
    });
  }
  if ((prev.newsCount ?? 0) !== (curr.newsCount ?? 0)) {
    drivers.push({
      driver: 'news',
      label: 'News change',
      detail: `Attached headlines ${prev.newsCount ?? 0} → ${curr.newsCount ?? 0}.`,
    });
  }
  if (prev.regimeLabel && curr.regimeLabel && prev.regimeLabel !== curr.regimeLabel) {
    drivers.push({
      driver: 'regime',
      label: 'Regime change',
      detail: `${prev.regimeLabel} → ${curr.regimeLabel}.`,
    });
  }
  if (prev.action && curr.action && prev.action !== curr.action) {
    drivers.push({
      driver: 'other',
      label: 'Research priority change',
      detail: `${prev.action} → ${curr.action} (process priority, not a trade call).`,
    });
  }
  if (Math.abs(prev.overallConfidence - curr.overallConfidence) >= 6) {
    drivers.push({
      driver: 'freshness',
      label: 'Evidence quality shift',
      detail: `Output quality ${prev.overallConfidence}% → ${curr.overallConfidence}%.`,
    });
  }

  if (!drivers.length) {
    drivers.push({
      driver: 'other',
      label: 'Stable evidence',
      detail: 'No material pillar shifts since the last recorded analysis.',
    });
  }

  return drivers.slice(0, 5);
}

export async function recordAiRecommendationSnapshot(
  snapshot: AiRecommendationSnapshot,
): Promise<AiWhyChanged | null> {
  const store = await loadStore();
  const key = snapshot.symbol.toUpperCase();
  const list = store[key] ?? [];
  const prev = list[list.length - 1];
  const merged = [...list, snapshot].slice(-MAX_PER_SYMBOL);
  store[key] = merged;
  await saveStore(store);

  if (!prev) return null;

  const drivers = diffDrivers(prev, snapshot);
  return {
    symbol: key,
    previousAt: prev.at,
    currentAt: snapshot.at,
    previousSummary: summarizeSnapshot(prev),
    currentSummary: summarizeSnapshot(snapshot),
    reason: drivers[0]?.detail ?? 'Context updated.',
    drivers,
  };
}

export async function getAiWhyChanged(symbol: string): Promise<AiWhyChanged | null> {
  const store = await loadStore();
  const list = store[symbol.toUpperCase()];
  if (!list || list.length < 2) return null;
  const prev = list[list.length - 2]!;
  const curr = list[list.length - 1]!;
  const drivers = diffDrivers(prev, curr);
  return {
    symbol: symbol.toUpperCase(),
    previousAt: prev.at,
    currentAt: curr.at,
    previousSummary: summarizeSnapshot(prev),
    currentSummary: summarizeSnapshot(curr),
    reason: drivers[0]?.detail ?? 'Context updated.',
    drivers,
  };
}

/** Confidence / priority history for Trust Center — process quality only. */
export async function getAiConfidenceHistory(
  symbol: string,
  limit = 8,
): Promise<AiConfidenceHistoryPoint[]> {
  const store = await loadStore();
  const list = store[symbol.toUpperCase()] ?? [];
  return list
    .slice(-limit)
    .reverse()
    .map((s) => ({
      at: s.at,
      overallConfidence: s.overallConfidence,
      action: s.action,
      bias: s.bias,
      summary: summarizeSnapshot(s),
    }));
}
