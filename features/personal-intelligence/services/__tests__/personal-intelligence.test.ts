import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { TraderMemory } from '@/features/decision/types/decision.types';

import { buildAdaptiveGoals } from '../adaptive-goals.service';
import { buildDnaEvolution } from '../dna-evolution.service';
import { buildDecisionGraph } from '../decision-graph.service';
import { buildPersonalIntelligence } from '../personal-intelligence.service';
import { buildPersonalizedToday, resolveTodayArchetype } from '../personalized-today.service';
import { buildTradingDnaTraits } from '../trading-dna-traits.service';

const memory: TraderMemory = {
  favoriteAssets: ['SPY'],
  tradingStyle: 'swing',
  riskTolerance: 'moderate',
  avgHoldHint: 'Multi-day',
  typicalMistakes: ['Early entries', 'Revenge trades'],
  favoriteIndicators: ['EMA', 'RSI'],
  bestSetups: ['Pullback with trend'],
  weakestSetups: ['Breakout chase'],
  notes: ['Wait for confirmation'],
  updatedAt: Date.now(),
};

function record(
  action: DecisionRecord['action'],
  daysAgo: number,
  extras: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id: `${action}-${daysAgo}`,
    symbol: 'SPY',
    regime: 'trending',
    action,
    createdAt: Date.now() - daysAgo * 86_400_000,
    decisionQualityScore: 70,
    ...extras,
  };
}

describe('personal intelligence platform', () => {
  const records: DecisionRecord[] = [
    record('researched', 1),
    record('skipped', 1),
    record('journaled', 2),
    record('replay_completed', 3),
    record('brief_opened', 0),
    record('researched', 40),
    record('ignored', 40),
  ];

  it('builds continuous Trading DNA traits from existing process data', () => {
    const dna = buildTradingDnaTraits({
      memory,
      records,
      heatmapScores: {
        consistencyScore: 62,
        learningScore: 55,
        disciplineScore: 58,
        improvementTrend: 'improving',
        trendDelta: 10,
      },
      processScoreWeek: 70,
    });

    expect(dna.traits.length).toBeGreaterThanOrEqual(13);
    expect(dna.traits.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'patience',
        'discipline',
        'risk',
        'research',
        'consistency',
        'confidence',
        'emotionalControl',
        'trendFollowing',
        'breakoutPreference',
        'swingPreference',
        'scalpingPreference',
        'riskManagement',
        'decisionQuality',
      ]),
    );
    expect(dna.becomingLabel.length).toBeGreaterThan(3);
    expect(dna.traits.find((t) => t.id === 'swingPreference')?.score).toBeGreaterThan(40);
  });

  it('adapts Today archetype for new traders toward Academy', () => {
    const dna = buildTradingDnaTraits({ memory, records: [] });
    const archetype = resolveTodayArchetype({
      dna,
      logSummary: {
        total: 2,
        researched: 1,
        skipped: 0,
        ignored: 0,
        journaled: 0,
        processScore: 30,
      },
      academyPracticed: 0,
    });
    expect(archetype).toBe('new_trader');
    const today = buildPersonalizedToday({ dna, academyPracticed: 0, academyNextTitle: 'Invalidation first' });
    expect(today.headline.toLowerCase()).toContain('lesson');
    expect(today.primaryCta.href).toContain('academy');
  });

  it('pushes journal-first Today when discipline is poor', () => {
    const dna = buildTradingDnaTraits({
      memory,
      records: [record('researched', 0), record('researched', 1), record('ignored', 1)],
      heatmapScores: {
        consistencyScore: 20,
        learningScore: 15,
        disciplineScore: 25,
        improvementTrend: 'slipping',
        trendDelta: -12,
      },
    });
    const today = buildPersonalizedToday({
      dna,
      logSummary: {
        total: 20,
        researched: 12,
        skipped: 1,
        ignored: 4,
        journaled: 0,
        processScore: 28,
      },
      debt: {
        score: 70,
        unreviewedSetups: 4,
        incompleteJournals: 8,
        unfinishedReplay: 2,
        unfinishedLessons: 3,
        ignoredAlerts: 2,
        items: [],
        encouragement: 'Close the loop',
      },
    });
    expect(today.archetype).toBe('poor_discipline');
    expect(today.headline.toLowerCase()).toContain('journal');
  });

  it('builds DNA evolution and decision graph without a second event store', () => {
    const dna = buildTradingDnaTraits({ memory, records });
    const evolution = buildDnaEvolution({ records, dna });
    expect(evolution.length).toBeGreaterThanOrEqual(2);
    expect(evolution[evolution.length - 1]?.styleLabel).toBeTruthy();

    const graph = buildDecisionGraph({ records, dna, period: 'weekly' });
    expect(graph.metrics).toHaveLength(9);
    expect(graph.metrics.map((m) => m.id)).toEqual(
      expect.arrayContaining(['consistency', 'journal', 'replay', 'academy', 'mentor']),
    );
    expect(graph.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('composes full Personal Intelligence snapshot with coaching references and goals', () => {
    const snapshot = buildPersonalIntelligence({
      memory,
      records,
      logSummary: {
        total: 12,
        researched: 6,
        skipped: 3,
        ignored: 1,
        journaled: 2,
        processScore: 66,
      },
      academyPracticed: 1,
      academyNextTitle: 'Patience under chop',
      startHereSymbol: 'SPY',
    });

    expect(snapshot.becomingQuestion).toContain('becoming');
    expect(snapshot.goals.length).toBeGreaterThan(0);
    expect(snapshot.memoryTimeline.length).toBeGreaterThan(0);
    expect(snapshot.coachingReferences.map((r) => r.id)).toEqual(
      expect.arrayContaining([
        'passport',
        'replay',
        'academy',
        'journal',
        'decisionGraph',
        'dna',
        'heatmap',
        'decisionLog',
      ]),
    );

    const goals = buildAdaptiveGoals({
      records,
      dna: snapshot.dna,
      today: snapshot.today,
      academyNextTitle: 'Patience under chop',
    });
    expect(goals.some((g) => g.id === 'academy_lesson' || g.id === 'replay_sessions')).toBe(true);
  });
});
