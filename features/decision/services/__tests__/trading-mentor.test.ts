import type { DecisionLogSummary } from '@/features/decision-log/services/decision-log.service';
import type { WeeklyGameTape } from '@/features/decision-replay/services/decision-replay.service';
import type { JournalCoachInsight, TraderMemory } from '@/features/decision/types/decision.types';
import {
  buildTradingMentorBrief,
  sanitizeMentorCopy,
} from '../trading-mentor.service';

const logSummary: DecisionLogSummary = {
  total: 12,
  researched: 7,
  skipped: 4,
  ignored: 1,
  journaled: 1,
  processScore: 72,
  insight: 'Selectivity improving',
};

const journalCoach: JournalCoachInsight = {
  winRate: 48,
  avgRr: 1.4,
  mostCommonMistake: 'Entering without clear invalidation',
  bestWeekday: 'Tuesday',
  worstCondition: 'Low-ADX breakouts',
  bestIndicator: 'VWAP',
  psychology: 'Fear after losses can raise stop-move risk.',
  edge: 'Pullback continuation',
  avoid: 'Breakout chasing in ranges',
  recommendation: 'Define invalidation before deep research.',
  processScore: 68,
  explainability: {
    confidence: 68,
    factors: [],
    agrees: 0,
    disagrees: 0,
    dataAsOf: Date.now(),
    freshness: 'unknown',
    reasoning: 'test',
  },
};

const memory: TraderMemory = {
  favoriteAssets: ['AAPL'],
  tradingStyle: 'Swing discretionary',
  riskTolerance: 'moderate',
  avgHoldHint: '2-5 days',
  typicalMistakes: ['Moving stops'],
  favoriteIndicators: ['EMA'],
  bestSetups: ['Trend pullbacks'],
  weakestSetups: ['Range breakouts'],
  notes: [],
  updatedAt: Date.now(),
};

const weeklyTape: WeeklyGameTape = {
  generatedAt: Date.now(),
  weekFromMs: Date.now() - 7 * 86_400_000,
  weekToMs: Date.now(),
  bestDecision: 'Skipped three low-RVS ideas',
  worstDecision: 'Researched without journaling',
  mostDisciplined: 'Passed on FOMO breakouts',
  mostEmotional: 'Sized up after a win',
  mostImprovedHabit: 'Opening the morning brief',
  mostRepeatedMistake: 'Entering without clear invalidation',
  lessonForNextWeek: 'Write invalidation first',
  evidenceNotes: ['4 skips logged', '1 journal entry'],
  processScore: 74,
};

describe('trading mentor composer', () => {
  it('sanitizes hype language', () => {
    expect(sanitizeMentorCopy('BUY NOW this will moon 100%')).not.toMatch(/buy now|moon|100%/i);
  });

  it('builds daily and weekly coaching without market predictions', () => {
    const brief = buildTradingMentorBrief({
      logSummary,
      journalCoach,
      memory,
      weeklyTape,
      streak: {
        days: 5,
        completedToday: { morningBrief: true, researchPlan: false, journal: false },
      },
      brief: {
        greeting: 'Hello',
        generatedAt: Date.now(),
        regime: 'ranging',
        regimeLabel: 'Ranging',
        highImpactEvents: [],
        setupCount: 0,
        topSetups: [],
        watchFocus: [],
        headline: 'Stay selective',
        summary: 'Chop favors patience',
        suggestResearch: [],
        explainability: journalCoach.explainability,
        quotesFetchedAt: Date.now(),
        psychologyReminder: "Today's objective is patience.",
        recommendedFocus: 'Journal every researched idea',
        processScoreWeek: 70,
      },
    });

    expect(brief.daily.headline.length).toBeGreaterThan(10);
    expect(brief.daily.todaysFocus.toLowerCase()).toContain('patience');
    expect(brief.daily.repeatingMistake.toLowerCase()).toContain('invalidation');
    expect(brief.weekly.mostImprovedHabit.toLowerCase()).toContain('brief');
    expect(brief.weekly.greatestStrength.length).toBeGreaterThan(5);
    expect(brief.weekly.challenge.length).toBeGreaterThan(5);
    expect(brief.weekly.replayRecommendation.href).toContain('decision-replay');
    expect(brief.learningStreakDays).toBe(5);
    expect(brief.identity.styleLabel.length).toBeGreaterThan(3);
    expect(`${brief.daily.headline} ${brief.daily.detail}`.toLowerCase()).not.toMatch(
      /buy now|moon|guaranteed/,
    );
  });

  it('maps academy remediation from repeated mistakes', () => {
    const brief = buildTradingMentorBrief({
      journalCoach,
      weeklyTape,
      logSummary,
    });
    expect(brief.weekly.academyRecommendation?.lessonId).toBeTruthy();
    expect(brief.weekly.academyRecommendation?.title.length).toBeGreaterThan(3);
  });
});
