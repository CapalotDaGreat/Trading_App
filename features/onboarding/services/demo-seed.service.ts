import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { JournalEntry } from '@/features/journal/types/journal.types';
import type { Holding } from '@/features/portfolio/types/portfolio.types';
import type { Watchlist } from '@/features/watchlists/services/watchlist.service';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';
import {
  getLocalUserRepository,
  resolveUserDataBackend,
  type LocalEntity,
} from '@/shared/services/user-data';
import type { PriceAlert } from '@/shared/types/market';

const DEMO_SEED_VERSION = 2;

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

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildDemoSeed() {
  const watchlist: Watchlist = {
    id: 'demo-watchlist',
    name: DEMO_WATCHLIST.name,
    symbols: DEMO_WATCHLIST.symbols,
    items: DEMO_WATCHLIST.symbols.map((symbol, sortOrder) => ({
      assetId: symbol,
      symbol,
      sortOrder,
      addedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    })),
    createdAt: isoDaysAgo(7),
    updatedAt: isoDaysAgo(1),
  };
  const journal: JournalEntry[] = [
    {
      id: 'demo-j1',
      symbol: 'NVDA',
      direction: 'long',
      entryPrice: 120,
      exitPrice: 124,
      quantity: 60,
      outcome: 'win',
      pnl: 240,
      pnlPercent: 3.3333333333,
      strategy: 'Trend pullback',
      tags: ['demo', 'planned'],
      emotion: 'neutral',
      notes: DEMO_JOURNAL_ENTRIES[0]!.notes,
      lessonsLearned: 'The pre-defined invalidation made the hold easier.',
      tradedAt: isoDaysAgo(5),
      closedAt: isoDaysAgo(4),
      createdAt: isoDaysAgo(5),
      updatedAt: isoDaysAgo(4),
    },
    {
      id: 'demo-j2',
      symbol: 'SPY',
      direction: 'long',
      entryPrice: 560,
      exitPrice: 558.3,
      quantity: 50,
      outcome: 'loss',
      pnl: -85,
      pnlPercent: -0.3035714286,
      strategy: 'Breakout',
      tags: ['demo', 'review'],
      emotion: 'fomo',
      notes: DEMO_JOURNAL_ENTRIES[1]!.notes,
      lessonsLearned: 'Wait for volume confirmation instead of chasing.',
      tradedAt: isoDaysAgo(2),
      closedAt: isoDaysAgo(2),
      createdAt: isoDaysAgo(2),
      updatedAt: isoDaysAgo(2),
    },
  ];
  const holdings: Holding[] = [
    {
      id: 'demo-h1',
      symbol: 'AAPL',
      name: 'Apple',
      marketType: 'stocks',
      assetClass: 'equity',
      quantity: 8,
      averageCost: 225,
      currentPrice: 225,
      currency: 'USD',
      side: 'long',
      notes: 'Demo position. Current price starts at cost until a quote is available.',
      createdAt: isoDaysAgo(6),
      updatedAt: isoDaysAgo(1),
    },
  ];
  const alerts: (PriceAlert & { note?: string })[] = [
    {
      id: 'demo-a1',
      symbol: 'NVDA',
      targetPrice: 130,
      condition: 'above',
      isActive: true,
      createdAt: Date.now() - 24 * 60 * 60 * 1000,
      note: 'Review the setup; this is not a buy signal.',
    },
  ];
  const decisionLog: DecisionRecord[] = [
    {
      id: 'demo-d1',
      symbol: 'NVDA',
      regime: 'trend',
      action: 'researched',
      note: 'Reviewed catalyst, trend, and invalidation.',
      researchValueScore: 74,
      decisionQualityScore: 78,
      risk: 'medium',
      eventKey: 'demo:nvda:researched',
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'demo-d2',
      symbol: 'SPY',
      regime: 'range',
      action: 'skipped',
      note: 'Skipped after volume confirmation failed.',
      researchValueScore: 38,
      decisionQualityScore: 82,
      risk: 'high',
      eventKey: 'demo:spy:skipped',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'demo-d3',
      symbol: 'SPY',
      regime: 'journal',
      action: 'journaled',
      note: 'Recorded the chase and review lesson.',
      eventKey: 'journal:demo-j2',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 + 60_000,
    },
  ];

  return { watchlist, journal, holdings, alerts, decisionLog };
}

export async function ensureDemoSeedData(uid = DEMO_USER_UID): Promise<void> {
  if (uid === DEMO_USER_UID && isFirebaseConfigured()) return;
  if (resolveUserDataBackend(uid) !== 'local') return;
  const seed = buildDemoSeed();
  await getLocalUserRepository(uid).seedIfNeeded(DEMO_SEED_VERSION, {
    watchlists: [seed.watchlist] as unknown as LocalEntity[],
    journal: seed.journal as unknown as LocalEntity[],
    holdings: seed.holdings as unknown as LocalEntity[],
    alerts: seed.alerts as unknown as LocalEntity[],
    decisionLog: seed.decisionLog as unknown as LocalEntity[],
  });
}

/** Resets only user feature data. Persisted settings and theme remain intact. */
export async function resetDemoSeedData(uid = DEMO_USER_UID): Promise<void> {
  if (resolveUserDataBackend(uid) !== 'local') return;
  await getLocalUserRepository(uid).reset();
}

/** Compatibility accessor for older onboarding callers. */
export async function loadDemoWatchlist(uid = DEMO_USER_UID): Promise<DemoWatchlistSeed | null> {
  const watchlist = (await getLocalUserRepository(uid).list<Watchlist>('watchlists'))[0];
  return watchlist ? { name: watchlist.name, symbols: watchlist.symbols } : null;
}

/** Compatibility accessor for older onboarding callers. */
export async function loadDemoJournal(uid = DEMO_USER_UID): Promise<DemoJournalSeed[]> {
  const entries = await getLocalUserRepository(uid).list<JournalEntry>('journal');
  return entries.map((entry) => ({
    id: entry.id,
    symbol: entry.symbol,
    direction: entry.direction,
    outcome: entry.outcome === 'loss' ? 'loss' : 'win',
    pnl: entry.pnl ?? 0,
    notes: entry.notes,
    createdAt: Date.parse(entry.createdAt),
  }));
}
