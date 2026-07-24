import type { DecisionAction, DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import {
  aggregateHeatmapDays,
  buildDecisionHeatmap,
  levelFromIntensity,
  learningEventsFromAcademyLessons,
  scoreDayProcessIntensity,
} from '../heatmap.service';

function makeRecord(
  action: DecisionAction,
  dayOffset: number,
  overrides: Partial<DecisionRecord> = {},
): DecisionRecord {
  const base = Date.UTC(2026, 6, 1) + dayOffset * 86_400_000;
  return {
    id: `r-${action}-${dayOffset}`,
    symbol: 'AAPL',
    regime: 'trending',
    action,
    createdAt: base + 12 * 3_600_000,
    ...overrides,
  };
}

describe('decision heatmap aggregation', () => {
  it('tracks journal, replay, checklist, research, and learning without profit fields', () => {
    const records = [
      makeRecord('journaled', 0, { eventKey: 'journal:1' }),
      makeRecord('replay_completed', 0, { eventKey: 'replay:1' }),
      makeRecord('checklist_done', 1, { eventKey: 'check:1' }),
      makeRecord('researched', 1, { decisionQualityScore: 80, eventKey: 'res:1' }),
      makeRecord('brief_opened', 2, { eventKey: 'brief:1' }),
    ];

    const map = aggregateHeatmapDays({
      records,
      fromMs: Date.UTC(2026, 5, 1),
      toMs: Date.UTC(2026, 7, 1),
      learningEvents: [{ at: Date.UTC(2026, 6, 3, 10), kind: 'academy_practiced' }],
    });

    const d0 = [...map.values()].find((d) => d.journalCompletions === 1);
    expect(d0?.replayCompletions).toBe(1);
    expect(d0?.journalCompletions).toBe(1);

    const intensity = scoreDayProcessIntensity(d0!);
    expect(intensity).toBeGreaterThan(40);
    expect(levelFromIntensity(intensity, true)).not.toBe('none');
  });

  it('never grades cells on profitability language in snapshot insight', () => {
    const snapshot = buildDecisionHeatmap({
      period: 'weekly',
      nowMs: Date.UTC(2026, 6, 20),
      records: [
        makeRecord('researched', 10, { decisionQualityScore: 72 }),
        makeRecord('journaled', 10),
        makeRecord('ignored', 11),
        makeRecord('replay_completed', 12),
      ],
      simulatorHistory: [{ createdAt: Date.UTC(2026, 6, 12, 15), processScore: 88 }],
      learningEvents: learningEventsFromAcademyLessons({
        lesson1: { practicedAt: '2026-07-13T12:00:00.000Z' },
      }),
    });

    expect(snapshot.scores.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(snapshot.scores.learningScore).toBeGreaterThan(0);
    expect(snapshot.scores.disciplineScore).toBeGreaterThan(0);
    expect(['improving', 'flat', 'slipping']).toContain(snapshot.scores.improvementTrend);
    expect(snapshot.insight.toLowerCase()).not.toMatch(/\bp&l\b|winning trade|returns|profitability/);
    expect(snapshot.insight.toLowerCase()).not.toMatch(/celebrate.*(win|gain)/);
    expect(snapshot.cells.some((c) => c.level !== 'none')).toBe(true);
  });

  it('maps empty days to no activity and learning days below good threshold', () => {
    expect(levelFromIntensity(0, false)).toBe('none');
    expect(levelFromIntensity(25, true)).toBe('learning');
    expect(levelFromIntensity(55, true)).toBe('good');
    expect(levelFromIntensity(80, true)).toBe('excellent');
  });

  it('dedupes decision log event keys', () => {
    const map = aggregateHeatmapDays({
      records: [
        makeRecord('journaled', 0, { eventKey: 'journal:same' }),
        makeRecord('journaled', 0, { eventKey: 'journal:same', id: 'dup' }),
      ],
      fromMs: Date.UTC(2026, 5, 1),
      toMs: Date.UTC(2026, 7, 1),
    });
    const day = [...map.values()][0];
    expect(day?.journalCompletions).toBe(1);
  });
});
