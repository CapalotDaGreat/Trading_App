jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('@/firebase/config', () => ({
  isFirebaseConfigured: jest.fn(() => false),
  requireDb: jest.fn(),
}));

import {
  countExplicitDecisionOutcomes,
  summarizeDecisionLog,
  type DecisionAction,
  type DecisionRecord,
} from '@/features/decision-log/services/decision-log.service';

const NOW = 1_800_000_000_000;

function record(
  id: string,
  action: DecisionAction,
  overrides: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id,
    symbol: 'AAPL',
    regime: 'Trending',
    action,
    createdAt: NOW,
    ...overrides,
  };
}

describe('decision log outcomes', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('summarizes explicit research, skip, ignore, and journal outcomes', () => {
    const summary = summarizeDecisionLog([
      record('opened', 'opened'),
      record('research', 'researched'),
      record('skip', 'skipped', { symbol: 'MSFT' }),
      record('ignore', 'ignored', { symbol: 'TSLA' }),
      record('journal', 'journaled'),
    ]);

    expect(summary).toMatchObject({
      total: 5,
      researched: 1,
      skipped: 1,
      ignored: 1,
      journaled: 1,
    });
  });

  it('deduplicates stable event keys when summarizing retries', () => {
    const first = record('first', 'researched', { eventKey: 'asset:AAPL:research:day' });
    const retry = record('retry', 'researched', { eventKey: 'asset:AAPL:research:day' });

    expect(summarizeDecisionLog([first, retry])).toMatchObject({
      total: 1,
      researched: 1,
    });
  });

  it('counts only explicit outcomes in the production event sequence', () => {
    const records = [
      record('brief', 'brief_opened'),
      record('open', 'opened'),
      record('view', 'viewed'),
      record('research', 'researched', { eventKey: 'research:AAPL:day' }),
      record('research-retry', 'researched', { eventKey: 'research:AAPL:day' }),
      record('skip', 'skipped', { symbol: 'MSFT' }),
      record('ignore', 'ignored', { symbol: 'TSLA' }),
      record('journal', 'journaled'),
    ];

    expect(countExplicitDecisionOutcomes(records, NOW - 86_400_000)).toBe(3);
  });
});
