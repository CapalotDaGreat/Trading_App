import AsyncStorage from '@react-native-async-storage/async-storage';

import { isFirebaseConfigured } from '@/firebase/config';

const DEMO_SEED_KEY = 'tradevision-demo-seeded-v1';

export interface DemoJournalSeed {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  outcome: 'win' | 'loss';
  pnl: number;
  notes: string;
  createdAt: number;
}

export interface DemoWatchlistSeed {
  name: string;
  symbols: string[];
}

export const DEMO_WATCHLIST: DemoWatchlistSeed = {
  name: 'Demo watchlist',
  symbols: ['NVDA', 'AAPL', 'SPY', 'BTC/USD'],
};

export const DEMO_JOURNAL_ENTRIES: DemoJournalSeed[] = [
  {
    id: 'demo-j1',
    symbol: 'NVDA',
    direction: 'long',
    outcome: 'win',
    pnl: 240,
    notes: 'Pullback entry aligned with daily trend. Held through noise.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-j2',
    symbol: 'SPY',
    direction: 'long',
    outcome: 'loss',
    pnl: -85,
    notes: 'Chased breakout without volume confirmation.',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

export async function ensureDemoSeedData(): Promise<void> {
  if (isFirebaseConfigured()) return;

  const done = await AsyncStorage.getItem(DEMO_SEED_KEY);
  if (done) return;

  await AsyncStorage.setItem('tradevision-demo-watchlist', JSON.stringify(DEMO_WATCHLIST));
  await AsyncStorage.setItem('tradevision-demo-journal', JSON.stringify(DEMO_JOURNAL_ENTRIES));
  await AsyncStorage.setItem(DEMO_SEED_KEY, '1');
}

export async function loadDemoWatchlist(): Promise<DemoWatchlistSeed | null> {
  try {
    const raw = await AsyncStorage.getItem('tradevision-demo-watchlist');
    return raw ? (JSON.parse(raw) as DemoWatchlistSeed) : null;
  } catch {
    return null;
  }
}

export async function loadDemoJournal(): Promise<DemoJournalSeed[]> {
  try {
    const raw = await AsyncStorage.getItem('tradevision-demo-journal');
    return raw ? (JSON.parse(raw) as DemoJournalSeed[]) : [];
  } catch {
    return [];
  }
}
