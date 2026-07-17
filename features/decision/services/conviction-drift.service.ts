import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  ConvictionDriftPoint,
  ConvictionDriftSnapshot,
  ImpactLevel,
} from '../types/decision.types';

const DRIFT_KEY = 'tradevision-conviction-drift-v1';

interface DriftStore {
  [symbol: string]: ConvictionDriftPoint[];
}

async function loadStore(): Promise<DriftStore> {
  try {
    const raw = await AsyncStorage.getItem(DRIFT_KEY);
    return raw ? (JSON.parse(raw) as DriftStore) : {};
  } catch {
    return {};
  }
}

async function saveStore(store: DriftStore): Promise<void> {
  await AsyncStorage.setItem(DRIFT_KEY, JSON.stringify(store));
}

export async function recordConvictionPoint(
  symbol: string,
  point: Omit<ConvictionDriftPoint, 'at'> & { at?: number },
): Promise<ConvictionDriftSnapshot> {
  const store = await loadStore();
  const key = symbol.toUpperCase();
  const list = store[key] ?? [];
  const next: ConvictionDriftPoint = {
    at: point.at ?? Date.now(),
    researchValue: point.researchValue,
    decisionQuality: point.decisionQuality,
    risk: point.risk,
    note: point.note,
  };
  const merged = [...list, next].slice(-24);
  store[key] = merged;
  await saveStore(store);
  return summarizeDrift(key, merged);
}

export async function getConvictionDrift(symbol: string): Promise<ConvictionDriftSnapshot | null> {
  const store = await loadStore();
  const list = store[symbol.toUpperCase()];
  if (!list?.length) return null;
  return summarizeDrift(symbol.toUpperCase(), list);
}

function summarizeDrift(symbol: string, points: ConvictionDriftPoint[]): ConvictionDriftSnapshot {
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const delta = last.researchValue - first.researchValue;
  const trend =
    delta >= 8 ? 'improving' : delta <= -8 ? 'deteriorating' : 'stable';
  const prev = points.length >= 2 ? points[points.length - 2] : undefined;
  let latestChange: string | undefined;
  if (prev) {
    const rv = last.researchValue - prev.researchValue;
    const dq = last.decisionQuality - prev.decisionQuality;
    if (Math.abs(rv) >= 5 || Math.abs(dq) >= 5) {
      latestChange = last.note || `RVS ${rv >= 0 ? '+' : ''}${rv}, DQS ${dq >= 0 ? '+' : ''}${dq}`;
    }
  }

  return { symbol, points, trend, latestChange };
}

export function describeRiskChange(from: ImpactLevel, to: ImpactLevel): string {
  if (from === to) return 'Risk unchanged';
  return `Risk moved ${from} → ${to}`;
}
