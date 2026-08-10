import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { TraderMemory } from '@/features/decision/types/decision.types';

import { buildAdaptiveGoals } from '../adaptive-goals.service';
import { buildDnaChangeInsights } from '../dna-change.service';
import { buildDnaEvolution } from '../dna-evolution.service';
import { buildDnaMentorSummary } from '../dna-mentor-summary.service';
import { buildDnaPatterns } from '../dna-patterns.service';
import { buildDecisionGraph } from '../decision-graph.service';
import { buildPersonalIntelligence } from '../personal-intelligence.service';
import { buildPersonalizedToday, resolveTodayArchetype } from '../personalized-today.service';
import { buildTradingDnaTraits } from '../trading-dna-traits.service';

const NOW = Date.UTC(2026, 7, 10, 12, 0, 0);

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
  updatedAt: NOW,
};

function record(
  action: DecisionRecord['action'],
  daysAgo: number,
  extras: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id: `${action}-${daysAgo}-${extras.symbol ?? 'SPY'}`,
    symbol: 'SPY',
    regime: 'trending',
    action,
    createdAt: NOW - daysAgo * 86_400_000,
    decisionQualityScore: 70,
    researchValueScore: 62,
    ...extras,
  };
}

describe('Trading DNA 2.0 personal intelligence', () => {
  const records: DecisionRecord[] = [
    record('researched', 1),
    record('skipped', 1),
    record('journaled', 2),
    record('replay_completed', 3),
    record('invalidated', 2),
    record('checklist_done', 1),
    record('brief_opened', 0),
    record('lab_closed', 4),
    record('researched', 40),
    record('ignored', 40),
    record('journaled', 20),
    record('skipped', 18),
  ];

  it('builds the 13 process traits with evidence and confidence', () => {
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
      nowMs: NOW,
    });

    expect(dna.traits).toHaveLength(13);
    expect(dna.traits.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'evidenceDiscipline',
        'riskAwareness',
        'patience',
        'thesisClarity',
        'invalidationDiscipline',
        'processConsistency',
        'emotionalAwareness',
        'fomoResistance',
        'overtradingResistance',
        'adaptability',
        'researchEfficiency',
        'reflectionQuality',
        'learningMomentum',
      ]),
    );
    expect(dna.styleFingerprint.labels.length).toBeGreaterThan(0);
    expect(dna.becomingLabel.length).toBeGreaterThan(3);
    const patience = dna.traits.find((t) => t.id === 'patience');
    expect(patience?.evidence.length).toBeGreaterThan(0);
    expect(patience?.confidence).toMatch(/low|medium|high/);
  });

  it('marks traits insufficient when evidence is too thin', () => {
    const dna = buildTradingDnaTraits({
      memory,
      records: [record('opened', 0)],
      nowMs: NOW,
    });
    const scored = dna.traits.filter((t) => t.status === 'scored');
    expect(scored.length).toBeLessThan(5);
    expect(dna.traits.some((t) => t.status === 'insufficient' && t.detail.includes('Not enough'))).toBe(
      true,
    );
  });

  it('does not fabricate DNA evolution history', () => {
    const dna = buildTradingDnaTraits({ memory, records: [], nowMs: NOW });
    const emptyEvolution = buildDnaEvolution({ records: [], dna, nowMs: NOW });
    expect(emptyEvolution).toHaveLength(1);
    expect(emptyEvolution[0]?.hasEvidence).toBe(false);
    expect(emptyEvolution[0]?.summary.toLowerCase()).toContain('not enough evidence');

    const withHistory = buildDnaEvolution({
      records,
      dna: buildTradingDnaTraits({ memory, records, nowMs: NOW }),
      nowMs: NOW,
    });
    expect(withHistory.every((p) => p.hasEvidence)).toBe(true);
    expect(withHistory.some((p) => /Momentum Trader/.test(p.styleLabel))).toBe(false);
  });

  it('adapts Today archetype for new decision-makers toward Academy', () => {
    const dna = buildTradingDnaTraits({ memory, records: [], nowMs: NOW });
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
    const today = buildPersonalizedToday({
      dna,
      academyPracticed: 0,
      academyNextTitle: 'Invalidation first',
    });
    expect(today.headline.toLowerCase()).toContain('lesson');
    expect(today.primaryCta.href).toContain('academy');
  });

  it('applies DNA adaptations when patience is weak', () => {
    const dna = buildTradingDnaTraits({
      memory: {
        ...memory,
        typicalMistakes: ['Impulse entries', 'FOMO chase'],
      },
      records: [
        record('researched', 0),
        record('researched', 1),
        record('researched', 2),
        record('ignored', 1),
        record('ignored', 2),
        record('skipped', 3), // enough evidence units; score still weak from ignores + impulse prior
      ],
      nowMs: NOW,
    });
    expect(dna.traits.find((t) => t.id === 'patience')?.status).toBe('scored');
    expect(dna.traits.find((t) => t.id === 'patience')?.score ?? 100).toBeLessThan(50);
    const today = buildPersonalizedToday({ dna });
    expect(today.dnaAdaptations ?? []).toEqual(
      expect.arrayContaining(['fewer_research_priorities']),
    );
  });

  it('prioritizes selected process goals in adaptive goals', () => {
    const snapshot = buildPersonalIntelligence({
      memory,
      records,
      nowMs: NOW,
      selectedGoals: ['improve_patience', 'improve_invalidation'],
      uid: 'test-user',
    });
    expect(snapshot.goals.some((g) => g.id === 'improve_patience' && g.selected)).toBe(true);
    expect(snapshot.goals[0]?.priority).toBe('high');
  });

  it('builds patterns, change insights, weekly review, and mentor summary without raw journal text', () => {
    const dna = buildTradingDnaTraits({ memory, records, nowMs: NOW });
    const patterns = buildDnaPatterns({ records, dna, nowMs: NOW });
    const whatsChanging = buildDnaChangeInsights({ dna, records, nowMs: NOW });
    const mentor = buildDnaMentorSummary({
      dna,
      whatsChanging,
      selectedGoals: ['improve_patience'],
      uid: 'test-user',
      nowMs: NOW,
    });

    expect(Array.isArray(patterns)).toBe(true);
    expect(whatsChanging.length).toBeGreaterThan(0);
    expect(mentor.observationLine.length).toBeGreaterThan(10);
    expect(JSON.stringify(mentor)).not.toMatch(/Dear diary|raw journal/i);
    expect(mentor.selectedGoals).toContain('Improve patience');
  });

  it('composes full Personal Intelligence snapshot with DNA 2.0 fields', () => {
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
      nowMs: NOW,
      uid: 'demo-guest',
    });

    expect(snapshot.becomingQuestion).toContain('decision-maker');
    expect(snapshot.patterns).toBeDefined();
    expect(snapshot.whatsChanging.length).toBeGreaterThan(0);
    expect(snapshot.weeklyReview).toBeDefined();
    expect(snapshot.monthlyReview.windows).toHaveLength(3);
    expect(snapshot.coachingActions.length).toBeGreaterThan(0);
    expect(snapshot.mentorSummary.becomingLabel).toBeTruthy();

    const graph = buildDecisionGraph({
      records,
      dna: snapshot.dna,
      period: 'weekly',
      nowMs: NOW,
    });
    expect(graph.metrics).toHaveLength(9);

    const goals = buildAdaptiveGoals({
      records,
      dna: snapshot.dna,
      today: snapshot.today,
      academyNextTitle: 'Patience under chop',
      nowMs: NOW,
    });
    expect(goals.some((g) => g.id === 'academy_lesson' || g.id === 'replay_sessions')).toBe(true);
  });
});
