import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';
import type { TraderMemory, TradingDna } from '@/features/decision/types/decision.types';

import {
  evaluatePassportAchievements,
} from './passport-achievements.service';
import { summarizePassport } from './passport.service';
import type {
  BuildPassportProfileInput,
  DecisionPassportProfile,
  PassportCounts,
  PassportPeriodSummary,
  PassportTimelineEvent,
  PassportTrendPoint,
} from '../types/passport.types';

const MS_DAY = 86_400_000;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function monthKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function yearKey(ms: number): string {
  return String(new Date(ms).getUTCFullYear());
}

function weekKey(ms: number): string {
  const d = new Date(ms);
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset));
  return monday.toISOString().slice(0, 10);
}

export function countPassportActivity(input: {
  records: DecisionRecord[];
  journalCount: number;
  academyCompleted: number;
  academyPracticed: number;
  academyTotal: number;
  simulatorSessions: number;
  labCloses: number;
  labRuleAdherence?: number;
}): PassportCounts {
  const seen = new Set<string>();
  let replays = 0;
  let disciplined = 0;
  let checklist = 0;
  let patience = 0;
  let research = 0;
  let journalsFromLog = 0;
  let replayTvEpisodes = 0;
  let replayTvCalmVol = 0;
  let replayTvEvidence = 0;
  let replayTvInvalidation = 0;

  for (const record of input.records) {
    if (record.eventKey) {
      if (seen.has(record.eventKey)) continue;
      seen.add(record.eventKey);
    }
    if (record.eventKey?.startsWith('replay-tv:')) {
      replayTvEpisodes += 1;
      const note = (record.note ?? '').toLowerCase();
      if (note.includes('rtv:calm_vol')) replayTvCalmVol += 1;
      if (note.includes('rtv:evidence')) replayTvEvidence += 1;
      if (note.includes('rtv:invalidation')) replayTvInvalidation += 1;
    }
    if (record.action === 'replay_completed') replays += 1;
    if (record.action === 'checklist_done') checklist += 1;
    if (record.action === 'skipped' || record.action === 'ignored') {
      disciplined += 1;
      patience += 1;
    }
    if (record.action === 'researched' || record.action === 'skipped' || record.action === 'ignored') {
      research += 1;
    }
    if (record.action === 'journaled') journalsFromLog += 1;
  }

  const riskManaged =
    input.labCloses > 0 && (input.labRuleAdherence ?? 0) >= 60
      ? input.labCloses
      : Math.min(input.labCloses, Math.floor((input.labRuleAdherence ?? 0) / 10));

  return {
    journals: Math.max(input.journalCount, journalsFromLog),
    replays,
    disciplinedActions: disciplined,
    academyLessonsCompleted: input.academyCompleted,
    academyLessonsPracticed: input.academyPracticed,
    academyTotal: input.academyTotal,
    checklistCompletions: checklist,
    patienceActions: patience,
    riskManagedCloses: Math.max(riskManaged, checklist > 0 ? Math.min(checklist, 10) : 0),
    simulatorSessions: input.simulatorSessions,
    labCloses: input.labCloses,
    researchSessions: research,
    replayTvEpisodes,
    replayTvCalmVol,
    replayTvEvidence,
    replayTvInvalidation,
  };
}

function buildTrend(
  records: DecisionRecord[],
  nowMs: number,
  weeks = 8,
): { dqs: PassportTrendPoint[]; rvs: PassportTrendPoint[] } {
  const from = nowMs - weeks * 7 * MS_DAY;
  const buckets = new Map<string, { dqs: number[]; rvs: number[]; activity: number }>();

  for (let i = 0; i < weeks; i += 1) {
    const t = nowMs - (weeks - 1 - i) * 7 * MS_DAY;
    const key = weekKey(t);
    buckets.set(key, { dqs: [], rvs: [], activity: 0 });
  }

  for (const record of records) {
    if (record.createdAt < from) continue;
    const key = weekKey(record.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.activity += 1;
    if (typeof record.decisionQualityScore === 'number') bucket.dqs.push(record.decisionQualityScore);
    if (typeof record.researchValueScore === 'number') bucket.rvs.push(record.researchValueScore);
  }

  const points: PassportTrendPoint[] = [...buckets.entries()].map(([key, b]) => ({
    key,
    label: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    decisionQualityAvg: avg(b.dqs),
    researchValueAvg: avg(b.rvs),
    processActivity: b.activity,
  }));

  return {
    dqs: points,
    rvs: points,
  };
}

function summarizePeriod(
  records: DecisionRecord[],
  key: string,
  label: string,
  fromMs: number,
  toMs: number,
): PassportPeriodSummary {
  const slice = records.filter((r) => r.createdAt >= fromMs && r.createdAt <= toMs);
  const seen = new Set<string>();
  let researched = 0;
  let journaled = 0;
  let replayed = 0;
  let skippedOrIgnored = 0;
  let academyEvents = 0;
  const dqs: number[] = [];
  const rvs: number[] = [];

  for (const record of slice) {
    if (record.eventKey) {
      if (seen.has(record.eventKey)) continue;
      seen.add(record.eventKey);
    }
    if (record.action === 'researched') researched += 1;
    if (record.action === 'journaled') journaled += 1;
    if (record.action === 'replay_completed') replayed += 1;
    if (record.action === 'skipped' || record.action === 'ignored') skippedOrIgnored += 1;
    if (record.action === 'brief_opened' || record.action === 'checklist_done' || record.action === 'lab_closed') {
      academyEvents += 1;
    }
    if (typeof record.decisionQualityScore === 'number') dqs.push(record.decisionQualityScore);
    if (typeof record.researchValueScore === 'number') rvs.push(record.researchValueScore);
  }

  let insight = 'Light process activity — keep logging decisions.';
  if (journaled >= 3 && skippedOrIgnored >= 2) {
    insight = 'Strong journal + selectivity balance.';
  } else if (replayed >= 2) {
    insight = 'Replay practice is compounding.';
  } else if (researched > 0 && journaled === 0) {
    insight = 'Research without journaling — close the loop.';
  } else if (skippedOrIgnored >= researched && researched > 0) {
    insight = 'Selectivity led the month — healthy discipline.';
  }

  return {
    key,
    label,
    fromMs,
    toMs,
    researched,
    journaled,
    replayed,
    skippedOrIgnored,
    academyEvents,
    avgDecisionQuality: avg(dqs),
    avgResearchValue: avg(rvs),
    insight,
  };
}

export function buildMonthlySummaries(records: DecisionRecord[], nowMs: number, count = 6): PassportPeriodSummary[] {
  const summaries: PassportPeriodSummary[] = [];
  const start = new Date(nowMs);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - i, 1));
    const fromMs = d.getTime();
    const toMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999);
    const key = monthKey(fromMs);
    const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
    summaries.push(summarizePeriod(records, key, label, fromMs, Math.min(toMs, nowMs)));
  }
  return summaries;
}

export function buildYearlySummaries(records: DecisionRecord[], nowMs: number, count = 3): PassportPeriodSummary[] {
  const year = new Date(nowMs).getUTCFullYear();
  const summaries: PassportPeriodSummary[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const y = year - i;
    const fromMs = Date.UTC(y, 0, 1);
    const toMs = Date.UTC(y, 11, 31, 23, 59, 59, 999);
    summaries.push(summarizePeriod(records, yearKey(fromMs), String(y), fromMs, Math.min(toMs, nowMs)));
  }
  return summaries;
}

/** Calendar quarters (UTC) for Passport / Journal learning chapters. */
export function buildQuarterlySummaries(
  records: DecisionRecord[],
  nowMs: number,
  count = 4,
): PassportPeriodSummary[] {
  const summaries: PassportPeriodSummary[] = [];
  const now = new Date(nowMs);
  const currentQuarter = Math.floor(now.getUTCMonth() / 3);
  let year = now.getUTCFullYear();
  let quarter = currentQuarter;

  for (let i = 0; i < count; i += 1) {
    const startMonth = quarter * 3;
    const fromMs = Date.UTC(year, startMonth, 1);
    const toMs = Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999);
    const key = `${year}-Q${quarter + 1}`;
    const label = `Q${quarter + 1} ${year}`;
    summaries.unshift(summarizePeriod(records, key, label, fromMs, Math.min(toMs, nowMs)));
    quarter -= 1;
    if (quarter < 0) {
      quarter = 3;
      year -= 1;
    }
  }

  return summaries;
}

function defaultDna(): TradingDna {
  return {
    styleLabel: 'Developing Operator',
    strengths: ['Showing up to the brief', 'Willingness to learn'],
    weaknesses: ['Incomplete journaling', 'Undefined invalidation'],
    bestConditions: ['Clear structure with defined risk'],
    avoidConditions: ['Forced trades without a thesis'],
  };
}

function resolveDna(memory?: TraderMemory | null, mentor?: BuildPassportProfileInput['mentor']): TradingDna {
  if (memory) return buildTradingDna(memory);
  if (mentor?.identity) {
    return {
      styleLabel: mentor.identity.styleLabel,
      strengths: mentor.identity.strengths,
      weaknesses: mentor.identity.weaknesses,
      bestConditions: mentor.identity.preferredRegimes,
      avoidConditions: mentor.identity.weaknesses.slice(0, 2),
      preferredRegimes: mentor.identity.preferredRegimes,
      riskTolerance: mentor.identity.riskTolerance,
    };
  }
  return defaultDna();
}

function buildTimeline(input: {
  achievements: ReturnType<typeof evaluatePassportAchievements>;
  monthly: PassportPeriodSummary[];
  counts: PassportCounts;
  processScoreWeek: number;
  nowMs: number;
}): PassportTimelineEvent[] {
  const events: PassportTimelineEvent[] = [];

  for (const achievement of input.achievements) {
    if (achievement.unlocked && achievement.earnedAt) {
      events.push({
        id: `ach-${achievement.id}`,
        at: achievement.earnedAt,
        title: achievement.title,
        detail: achievement.celebrateCopy,
        kind: 'achievement',
      });
    }
  }

  for (const month of input.monthly) {
    if (month.journaled + month.researched + month.replayed === 0) continue;
    const qualityNote =
      month.avgDecisionQuality != null
        ? `Avg Decision Quality ${month.avgDecisionQuality}`
        : 'Process activity logged';
    events.push({
      id: `month-${month.key}`,
      at: month.toMs,
      title: `${month.label} process chapter`,
      detail: `${qualityNote}. ${month.insight}`,
      kind: month.avgDecisionQuality != null && month.avgDecisionQuality >= 65 ? 'quality' : 'habit',
    });
  }

  if (input.counts.academyLessonsPracticed > 0) {
    events.push({
      id: 'academy-practice',
      at: input.nowMs - MS_DAY,
      title: 'Academy practice compounding',
      detail: `${input.counts.academyLessonsPracticed} lessons practiced — soft mastery path.`,
      kind: 'learning',
    });
  }

  if (input.processScoreWeek >= 70) {
    events.push({
      id: 'week-process',
      at: input.nowMs,
      title: 'Strong process week',
      detail: `Weekly process score ${input.processScoreWeek} — celebrate discipline, not outcomes.`,
      kind: 'quality',
    });
  }

  return events.sort((a, b) => b.at - a.at).slice(0, 24);
}

/**
 * Compose the Decision Passport profile from existing systems.
 * Does not recompute RVS/DQS/heatmap — only aggregates already-derived values.
 */
export function buildDecisionPassportProfile(input: BuildPassportProfileInput): DecisionPassportProfile {
  const nowMs = input.nowMs ?? Date.now();
  const snapshot = summarizePassport({
    processScores: input.processScores,
    credentials: input.credentials,
    lastAction: input.lastAction,
  });

  const counts = countPassportActivity({
    records: input.logRecords,
    journalCount: input.journalCount,
    academyCompleted: input.academyCompleted,
    academyPracticed: input.academyPracticed,
    academyTotal: input.academyTotal,
    simulatorSessions: snapshot.processSessions,
    labCloses: input.labStats?.tradesClosed ?? 0,
    labRuleAdherence: input.labStats?.ruleAdherencePercent,
  });

  const streakDays = input.mentor?.learningStreakDays ?? 0;
  const consistencyScore = input.heatmapScores?.consistencyScore ?? 0;

  const achievements = evaluatePassportAchievements({
    counts,
    streakDays,
    consistencyScore,
    unlockedDates: input.unlockedAchievementDates,
    nowMs,
  });

  const dna = resolveDna(input.memory, input.mentor);
  const trends = buildTrend(input.logRecords, nowMs);
  const monthlySummaries = buildMonthlySummaries(input.logRecords, nowMs);
  const yearlySummaries = buildYearlySummaries(input.logRecords, nowMs);

  const processScoreWeek =
    input.mentor?.processScoreWeek ??
    input.logSummary?.processScore ??
    input.heatmapScores?.disciplineScore ??
    0;

  const psychology =
    input.mentor?.daily.repeatingMistake
      ? `Watch for: ${input.mentor.daily.repeatingMistake}`
      : input.memory?.typicalMistakes?.[0]
        ? `Memory cue: ${input.memory.typicalMistakes[0]}`
        : 'Build psychology notes by journaling emotions without grading P&L.';

  const learningMilestones: string[] = [];
  if (counts.journals >= 10) learningMilestones.push('Double-digit journaling habit');
  if (counts.replays >= 5) learningMilestones.push('Replay loop established');
  if (counts.replayTvEpisodes >= 1) learningMilestones.push('Replay TV historian started');
  if (counts.academyLessonsPracticed >= 3) learningMilestones.push('Academy practice gates used');
  if (counts.simulatorSessions >= 3) learningMilestones.push('Simulator decision reps started');
  if ((input.labStats?.tradesClosed ?? 0) >= 3) learningMilestones.push('Decision Lab reps logged');
  if (consistencyScore >= 40) learningMilestones.push('Heatmap consistency emerging');

  const queueLen = input.brief?.researchQueue?.length ?? 0;
  const researchQueueNote =
    queueLen > 0
      ? `${queueLen} ideas on today’s research queue — priority is process, not coverage.`
      : 'Research queue is clear — protect attention.';

  const portfolioNote = input.risk
    ? `Risk center ${input.risk.riskScore}/100 · ${input.risk.recommendation}`
    : undefined;

  const academyPercent =
    input.academyTotal === 0 ? 0 : clamp((input.academyCompleted / input.academyTotal) * 100);

  const timeline = buildTimeline({
    achievements,
    monthly: monthlySummaries,
    counts,
    processScoreWeek,
    nowMs,
  });

  return {
    generatedAt: nowMs,
    processSessions: snapshot.processSessions,
    averageProcessScore: snapshot.averageProcessScore,
    lastAction: snapshot.lastAction,
    credentials: snapshot.credentials,
    identity: {
      styleLabel: dna.styleLabel,
      riskTolerance: String(dna.riskTolerance ?? input.memory?.riskTolerance ?? 'moderate'),
      preferredAssets: input.memory?.favoriteAssets?.slice(0, 6) ?? [],
      summary: input.mentor?.identity.styleLabel
        ? `${input.mentor.identity.styleLabel} · process-first operator`
        : `${dna.styleLabel} · growth profile, not a performance report`,
    },
    dna,
    learningJourney: {
      academyCompleted: input.academyCompleted,
      academyPracticed: input.academyPracticed,
      academyTotal: input.academyTotal,
      labCloses: input.labStats?.tradesClosed ?? 0,
      labAvgProcess: input.labStats?.avgProcessScore ?? 0,
      simulatorSessions: snapshot.processSessions,
      journalCount: counts.journals,
      replayCount: counts.replays,
      milestones: learningMilestones,
    },
    strengths: dna.strengths,
    weaknesses: dna.weaknesses,
    bestMarketConditions: dna.bestConditions,
    decisionQualityTrend: trends.dqs,
    researchValueTrend: trends.rvs,
    psychologySummary: psychology,
    consistency: {
      heatmap: input.heatmapScores ?? undefined,
      processScoreWeek,
      streakDays,
      insight:
        input.heatmapScores?.improvementTrend === 'improving'
          ? 'Heatmap process intensity is rising.'
          : input.heatmapScores?.improvementTrend === 'slipping'
            ? 'Consistency cooled — Mentor focus can rebuild the streak.'
            : 'Consistency is a habit score — never a profit score.',
    },
    currentFocus: {
      headline: input.mentor?.daily.headline ?? 'Open Today’s brief to personalize focus',
      todaysFocus:
        input.mentor?.daily.todaysFocus ??
        input.brief?.recommendedFocus ??
        'Log one researched or skipped idea with a Why-Not note',
      improveNext:
        input.mentor?.daily.improveNext ??
        'Pair one journal with one Decision Replay this week',
    },
    mentorGoals: {
      currentGoal: input.mentor?.currentGoal ?? 'Build a durable decision process',
      challenge:
        input.mentor?.weekly.challenge ??
        'Complete one checklist and one journal before adding research volume',
      academyLessonId: input.mentor?.weekly.academyRecommendation?.lessonId,
      academyTitle: input.mentor?.weekly.academyRecommendation?.title,
      replayHref: input.mentor?.weekly.replayRecommendation?.href,
      replayLabel: input.mentor?.weekly.replayRecommendation?.label,
    },
    achievements,
    learningMilestones,
    replayHistory: {
      count: counts.replays,
      recentNotes: input.logRecords
        .filter((r) => r.action === 'replay_completed')
        .slice(0, 5)
        .map((r) => r.note ?? `${r.symbol} replay`),
    },
    academyProgress: {
      completed: input.academyCompleted,
      practiced: input.academyPracticed,
      total: input.academyTotal,
      percent: academyPercent,
    },
    portfolioNote,
    researchQueueNote,
    monthlySummaries,
    yearlySummaries,
    timeline,
    exportReady: {
      status: 'ready',
      message:
        'Share a JSON process profile (identity, DNA, trends, achievements). Not a P&L or brokerage statement.',
    },
    counts,
  };
}
