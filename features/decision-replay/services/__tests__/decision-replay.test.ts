jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  buildCoachForRecord,
  buildDecisionReplaySession,
  buildLearningInsights,
  buildWeeklyGameTape,
} from '../decision-replay.service';
import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

function rec(
  partial: Partial<DecisionRecord> & Pick<DecisionRecord, 'action' | 'createdAt'>,
): DecisionRecord {
  return {
    id: partial.id ?? `r-${partial.createdAt}`,
    symbol: partial.symbol ?? 'SPY',
    regime: partial.regime ?? 'trending',
    action: partial.action,
    createdAt: partial.createdAt,
    setupScore: partial.setupScore,
    researchValueScore: partial.researchValueScore,
    decisionQualityScore: partial.decisionQualityScore,
    note: partial.note,
    invalidation: partial.invalidation,
    risk: partial.risk,
  };
}

describe('decision-replay.service', () => {
  const now = new Date('2026-07-17T15:00:00Z').getTime();
  const dayStart = new Date('2026-07-17T00:00:00').getTime();

  const records: DecisionRecord[] = [
    rec({
      action: 'brief_opened',
      symbol: '',
      createdAt: dayStart + 8 * 3600_000 + 10 * 60_000,
      note: 'Brief',
    }),
    rec({
      action: 'researched',
      symbol: 'BTC/USD',
      createdAt: dayStart + 8 * 3600_000 + 18 * 60_000,
      researchValueScore: 78,
      decisionQualityScore: 65,
      invalidation: 'Below 60k',
    }),
    rec({
      action: 'ignored',
      symbol: 'NVDA',
      createdAt: dayStart + 8 * 3600_000 + 26 * 60_000,
      researchValueScore: 81,
    }),
    rec({
      action: 'journaled',
      symbol: 'BTC/USD',
      createdAt: dayStart + 9 * 3600_000 + 20 * 60_000,
    }),
  ];

  it('builds a today session with coach frames', () => {
    const session = buildDecisionReplaySession({
      records,
      range: 'today',
      now,
    });
    expect(session.frames.length).toBe(4);
    expect(session.frames[0]?.label).toMatch(/Brief/i);
    expect(session.frames[1]?.coach.processNote.toLowerCase()).not.toContain('lost money');
    expect(session.scoreEvolution.length).toBe(4);
  });

  it('focuses coach language on process not P&L', () => {
    const coach = buildCoachForRecord(
      rec({
        action: 'researched',
        createdAt: now,
        invalidation: undefined,
      }),
    );
    expect(coach.processNote.toLowerCase()).toContain('invalidation');
    expect(coach.questions.some((q) => /overlook|confidence|same decision/i.test(q.question))).toBe(
      true,
    );
  });

  it('builds evidence-backed learning insights', () => {
    const insights = buildLearningInsights([
      ...records,
      rec({
        action: 'ignored',
        symbol: 'AAPL',
        createdAt: now - 1000,
        researchValueScore: 75,
      }),
    ]);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((i) => i.evidence.length > 0)).toBe(true);
  });

  it('builds weekly game tape with lesson', () => {
    const tape = buildWeeklyGameTape(records, [], undefined, now);
    expect(tape.lessonForNextWeek.length).toBeGreaterThan(10);
    expect(tape.bestDecision.length).toBeGreaterThan(5);
    expect(tape.processScore).toBeGreaterThanOrEqual(0);
  });
});
