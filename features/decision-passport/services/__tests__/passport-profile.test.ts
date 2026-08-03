import type { DecisionAction, DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import { evaluatePassportAchievements } from '../passport-achievements.service';
import { buildPassportExportStub } from '../passport-export.service';
import {
  buildDecisionPassportProfile,
  buildMonthlySummaries,
  countPassportActivity,
} from '../passport-profile.service';

function makeRecord(
  action: DecisionAction,
  dayOffset: number,
  overrides: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id: `r-${action}-${dayOffset}`,
    symbol: 'MSFT',
    regime: 'trending',
    action,
    createdAt: Date.UTC(2026, 6, 1) + dayOffset * 86_400_000,
    ...overrides,
  };
}

describe('decision passport profile', () => {
  it('composes growth sections without inventing profit grades', () => {
    const records = [
      makeRecord('journaled', 0, { eventKey: 'j1' }),
      makeRecord('replay_completed', 1, { eventKey: 'rp1' }),
      makeRecord('ignored', 2, { eventKey: 'ig1' }),
      makeRecord('researched', 3, {
        decisionQualityScore: 78,
        researchValueScore: 64,
        eventKey: 'rs1',
      }),
      makeRecord('checklist_done', 4, { eventKey: 'ck1' }),
    ];

    const profile = buildDecisionPassportProfile({
      credentials: [],
      processScores: [82, 74],
      unlockedAchievementDates: {},
      logRecords: records,
      journalCount: 12,
      academyCompleted: 8,
      academyPracticed: 3,
      academyTotal: 40,
      heatmapScores: {
        consistencyScore: 55,
        learningScore: 48,
        disciplineScore: 62,
        improvementTrend: 'improving',
        trendDelta: 12,
      },
      mentor: {
        generatedAt: Date.now(),
        daily: {
          headline: 'Protect attention',
          detail: 'Skip thin setups',
          todaysFocus: 'One Why-Not note',
          improveNext: 'Journal after research',
          repeatingMistake: 'Over-researching',
        },
        weekly: {
          mostImprovedHabit: 'Skipping',
          mostCommonMistake: 'No invalidation',
          greatestStrength: 'Showing up',
          challenge: 'Checklist before deep dive',
          academyRecommendation: null,
          replayRecommendation: {
            href: '/decision/decision-replay',
            label: 'Replay',
            reason: 'Process tape',
          },
        },
        currentGoal: 'Build selectivity',
        learningStreakDays: 4,
        loopStepsCompletedToday: 2,
        identity: {
          styleLabel: 'Swing Operator',
          strengths: ['Patience'],
          weaknesses: ['FOMO'],
          preferredRegimes: ['Trending'],
          riskTolerance: 'moderate',
        },
        processScoreWeek: 71,
        regimeLabel: 'Trending',
        evidenceNotes: [],
      },
      nowMs: Date.UTC(2026, 6, 20),
    });

    expect(profile.identity.styleLabel).toBeTruthy();
    expect(profile.currentFocus.todaysFocus).toContain('Why-Not');
    expect(profile.mentorGoals.currentGoal).toContain('selectivity');
    expect(profile.decisionQualityTrend.length).toBeGreaterThan(0);
    expect(profile.monthlySummaries.length).toBe(6);
    expect(profile.yearlySummaries.length).toBe(3);
    expect(profile.achievements.length).toBeGreaterThan(5);
    expect(profile.exportReady.status).toBe('ready');
    expect(JSON.stringify(profile).toLowerCase()).not.toMatch(/winning trades|profitability report/);
  });

  it('counts activity and unlocks discipline achievements from process counters', () => {
    const counts = countPassportActivity({
      records: Array.from({ length: 25 }, (_, i) =>
        makeRecord('ignored', i, { eventKey: `ig-${i}` }),
      ),
      journalCount: 100,
      academyCompleted: 100,
      academyPracticed: 10,
      academyTotal: 120,
      simulatorSessions: 12,
      labCloses: 10,
      labRuleAdherence: 80,
    });

    expect(counts.journals).toBe(100);
    expect(counts.disciplinedActions).toBe(25);
    expect(counts.patienceActions).toBe(25);

    const achievements = evaluatePassportAchievements({
      counts,
      streakDays: 7,
      consistencyScore: 70,
      unlockedDates: {},
    });

    expect(achievements.find((a) => a.id === 'journals_100')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'academy_100')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'patience_25')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'checklist_streak_7')?.unlocked).toBe(true);
  });

  it('builds monthly summaries and a shareable passport JSON package', () => {
    const records = [
      makeRecord('researched', 0),
      makeRecord('journaled', 1),
      makeRecord('replay_completed', 2),
    ];
    const monthly = buildMonthlySummaries(records, Date.UTC(2026, 6, 20), 3);
    expect(monthly).toHaveLength(3);

    const profile = buildDecisionPassportProfile({
      credentials: [],
      processScores: [],
      unlockedAchievementDates: {},
      logRecords: records,
      journalCount: 1,
      academyCompleted: 0,
      academyPracticed: 0,
      academyTotal: 10,
      nowMs: Date.UTC(2026, 6, 20),
    });
    const stub = buildPassportExportStub(profile);
    expect(stub.status).toBe('ready');
    expect(stub.suggestedFilename).toContain('decision-passport');
    expect(stub.suggestedFilename.endsWith('.json')).toBe(true);
    expect(stub.sections).toContain('Trading DNA');
    expect(profile.exportReady.status).toBe('ready');
  });
});
