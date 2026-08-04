jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('@/firebase/config', () => ({
  requireDb: jest.fn(() => ({})),
}));

import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import { buildQuarterlySummaries } from '@/features/decision-passport/services/passport-profile.service';
import type { JournalEntry } from '@/features/journal/types/journal.types';

import { buildJournalLearningJourney } from '../journal-learning-journey.service';
import { buildJournalPsychologyTrends } from '../journal-psychology.service';
import { buildJournalStrategyInsights } from '../journal-strategy-insights.service';

function makeEntry(partial: Partial<JournalEntry> & { id: string }): JournalEntry {
  const now = new Date().toISOString();
  return {
    symbol: 'AAPL',
    direction: 'long',
    entryPrice: 100,
    quantity: 1,
    outcome: 'open',
    tags: [],
    notes: 'Process note',
    tradedAt: now,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function makeRecord(
  action: DecisionRecord['action'],
  daysAgo: number,
  extra: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id: `${action}-${daysAgo}-${extra.symbol ?? 'x'}`,
    symbol: extra.symbol ?? 'AAPL',
    action,
    regime: 'trending',
    createdAt: Date.now() - daysAgo * 86_400_000,
    ...extra,
  };
}

describe('Journal learning journey', () => {
  it('builds psychology trends from emotion tags without inventing P&L grades', () => {
    const trends = buildJournalPsychologyTrends([
      makeEntry({ id: '1', emotion: 'fomo', tradedAt: new Date().toISOString() }),
      makeEntry({ id: '2', emotion: 'fearful', tradedAt: new Date().toISOString() }),
      makeEntry({ id: '3', emotion: 'neutral', tradedAt: new Date().toISOString() }),
    ]);
    expect(trends.stressShare).toBeGreaterThan(50);
    expect(trends.narrative.toLowerCase()).toMatch(/stress|fear|fomo/);
    expect(trends.weeklyPoints.length).toBeGreaterThan(0);
  });

  it('surfaces strategy insights from strategy and tags', () => {
    const insights = buildJournalStrategyInsights([
      makeEntry({
        id: '1',
        strategy: 'Breakout',
        lessonsLearned: 'Wait for close',
        planAdhered: true,
      }),
      makeEntry({ id: '2', strategy: 'Breakout', planAdhered: false }),
      makeEntry({ id: '3', tags: ['mean-reversion'] }),
    ]);
    expect(insights[0]?.strategy).toBe('Breakout');
    expect(insights[0]?.tip.length).toBeGreaterThan(10);
  });

  it('builds quarterly summaries for journal review chapters', () => {
    const now = Date.UTC(2026, 6, 20);
    const records = [
      makeRecord('journaled', 10),
      makeRecord('researched', 20),
      makeRecord('replay_completed', 40),
    ];
    const quarters = buildQuarterlySummaries(records, now, 4);
    expect(quarters).toHaveLength(4);
    expect(quarters[quarters.length - 1]?.key).toMatch(/Q/);
  });

  it('composes a connected learning journey from journal + decision log', () => {
    const entries = [
      makeEntry({
        id: 'j1',
        emotion: 'fomo',
        strategy: 'Momentum',
        lessonsLearned: 'Write invalidation first',
        planAdhered: false,
        mistakeCategory: 'no_plan',
        linkedReplayHref: '/decision/replay-tv',
        tags: ['checklist'],
      }),
      makeEntry({
        id: 'j2',
        emotion: 'neutral',
        strategy: 'Momentum',
        lessonsLearned: 'Protect attention',
        planAdhered: true,
        quantity: 0,
      }),
    ];
    const records = [
      makeRecord('researched', 1),
      makeRecord('journaled', 0, { eventKey: 'journal:j1', note: entries[0]!.notes }),
      makeRecord('replay_completed', 2, { eventKey: 'replay-tv:covid-crash:1' }),
      makeRecord('skipped', 3),
    ];

    const journey = buildJournalLearningJourney({
      entries,
      records,
      coach: {
        winRate: 50,
        avgRr: 1.2,
        mostCommonMistake: 'Acting without a written plan or checklist',
        bestWeekday: 'Tuesday',
        worstCondition: 'FOMO tags',
        bestIndicator: 'Momentum',
        psychology: 'FOMO states need slower research',
        edge: 'Momentum with invalidation',
        avoid: 'Impulse entries',
        recommendation: 'One checklist before deep research',
        processScore: 62,
        explainability: {
          confidence: 62,
          factors: [],
          agrees: 0,
          disagrees: 0,
          dataAsOf: Date.now(),
          freshness: 'recent',
          reasoning: 'process',
        },
      },
    });

    expect(journey.timeline.length).toBeGreaterThan(0);
    expect(journey.weeklyReview).toBeTruthy();
    expect(journey.weeklyTape).toBeTruthy();
    expect(journey.monthly.length).toBeGreaterThan(0);
    expect(journey.quarterly.length).toBe(4);
    expect(journey.yearly.length).toBeGreaterThan(0);
    expect(journey.behaviorInsights.length).toBeGreaterThan(0);
    expect(journey.psychology.dominantEmotion).toBeTruthy();
    expect(journey.strategyInsights[0]?.strategy).toBe('Momentum');
    expect(journey.improvements.length).toBeGreaterThan(0);
    expect(journey.replayReferences.some((r) => r.href.includes('replay-tv'))).toBe(true);
    expect(journey.academyRecommendations.length).toBeGreaterThan(0);
    expect(JSON.stringify(journey).toLowerCase()).not.toMatch(/buy signal|guaranteed profit/);
  });
});
