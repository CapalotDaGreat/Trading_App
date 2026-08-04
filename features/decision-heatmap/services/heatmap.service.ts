import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type {
  HeatmapBuildInput,
  HeatmapCell,
  HeatmapDayActivity,
  HeatmapLearningEvent,
  HeatmapPeriod,
  HeatmapProcessLevel,
  HeatmapScores,
  HeatmapSnapshot,
  HeatmapTrend,
} from '../types/heatmap.types';

const MS_DAY = 86_400_000;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function dayKeyFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function startOfUtcDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseDayKey(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Monday-start ISO-like week key (UTC). */
export function weekKeyFromMs(ms: number): string {
  const start = startOfUtcDay(ms);
  const day = new Date(start).getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return dayKeyFromMs(start + mondayOffset * MS_DAY);
}

export function monthKeyFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function yearKeyFromMs(ms: number): string {
  return `${new Date(ms).getUTCFullYear()}-01-01`;
}

export function bucketKeyForPeriod(ms: number, period: HeatmapPeriod): string {
  if (period === 'weekly') return weekKeyFromMs(ms);
  if (period === 'monthly') return monthKeyFromMs(ms);
  if (period === 'yearly') return yearKeyFromMs(ms);
  return dayKeyFromMs(ms);
}

export function periodRange(period: HeatmapPeriod, nowMs = Date.now()): { fromMs: number; toMs: number } {
  const toMs = nowMs;
  if (period === 'daily') {
    // ~13 weeks of day cells
    return { fromMs: startOfUtcDay(nowMs) - 90 * MS_DAY, toMs };
  }
  if (period === 'weekly') {
    return { fromMs: startOfUtcDay(nowMs) - 52 * 7 * MS_DAY, toMs };
  }
  if (period === 'monthly') {
    return { fromMs: startOfUtcDay(nowMs) - 24 * 30 * MS_DAY, toMs };
  }
  return { fromMs: startOfUtcDay(nowMs) - 5 * 365 * MS_DAY, toMs };
}

function emptyActivity(day: string): HeatmapDayActivity {
  return {
    day,
    journalCompletions: 0,
    replayCompletions: 0,
    checklistUses: 0,
    researchSessions: 0,
    learningSessions: 0,
    academyEvents: 0,
    averageDecisionQuality: null,
    simulatorProcessScores: [],
    eventCount: 0,
  };
}

function isResearchAction(action: DecisionRecord['action']): boolean {
  return action === 'researched' || action === 'skipped' || action === 'ignored';
}

function isLearningAction(action: DecisionRecord['action']): boolean {
  return (
    action === 'replay_completed' ||
    action === 'brief_opened' ||
    action === 'ai_opened' ||
    action === 'lab_opened' ||
    action === 'lab_closed' ||
    action === 'checklist_done'
  );
}

/**
 * Aggregate process signals onto calendar days.
 * Decision Log is the spine; academy + simulator enrich without a parallel store.
 */
export function aggregateHeatmapDays(input: {
  records: DecisionRecord[];
  fromMs: number;
  toMs: number;
  learningEvents?: HeatmapLearningEvent[];
  simulatorHistory?: { createdAt: number; processScore: number }[];
}): Map<string, HeatmapDayActivity> {
  const map = new Map<string, HeatmapDayActivity>();
  const seenKeys = new Set<string>();

  const ensure = (day: string) => {
    let row = map.get(day);
    if (!row) {
      row = emptyActivity(day);
      map.set(day, row);
    }
    return row;
  };

  for (const record of input.records ?? []) {
    if (record.createdAt < input.fromMs || record.createdAt > input.toMs) continue;
    if (record.eventKey) {
      if (seenKeys.has(record.eventKey)) continue;
      seenKeys.add(record.eventKey);
    }

    const day = dayKeyFromMs(record.createdAt);
    const row = ensure(day);
    row.eventCount += 1;

    if (record.action === 'journaled') row.journalCompletions += 1;
    if (record.action === 'replay_completed') row.replayCompletions += 1;
    if (record.action === 'checklist_done') row.checklistUses += 1;
    if (isResearchAction(record.action)) row.researchSessions += 1;
    if (isLearningAction(record.action)) row.learningSessions += 1;

    if (typeof record.decisionQualityScore === 'number') {
      const prev = row.averageDecisionQuality;
      row.averageDecisionQuality =
        prev == null ? record.decisionQualityScore : (prev + record.decisionQualityScore) / 2;
    }
  }

  for (const event of input.learningEvents ?? []) {
    if (event.at < input.fromMs || event.at > input.toMs) continue;
    const day = dayKeyFromMs(event.at);
    const row = ensure(day);
    row.academyEvents += 1;
    row.learningSessions += 1;
    row.eventCount += 1;
  }

  for (const sim of input.simulatorHistory ?? []) {
    if (sim.createdAt < input.fromMs || sim.createdAt > input.toMs) continue;
    const day = dayKeyFromMs(sim.createdAt);
    const row = ensure(day);
    row.simulatorProcessScores.push(sim.processScore);
    row.learningSessions += 1;
    row.eventCount += 1;
    // Simulator checklist discipline is reflected in process score; count as checklist use when strong.
    if (sim.processScore >= 70) row.checklistUses += 1;
  }

  return map;
}

/** Process intensity for a day — never uses price or P&L. */
export function scoreDayProcessIntensity(activity: HeatmapDayActivity): number {
  if (activity.eventCount === 0) return 0;

  let score = 0;
  if (activity.journalCompletions > 0) score += 22;
  if (activity.replayCompletions > 0) score += 18;
  if (activity.checklistUses > 0) score += 14;
  if (activity.researchSessions > 0) score += 14;
  if (activity.learningSessions > 0 || activity.academyEvents > 0) score += 12;

  if (activity.averageDecisionQuality != null) {
    if (activity.averageDecisionQuality >= 75) score += 20;
    else if (activity.averageDecisionQuality >= 55) score += 12;
    else score += 4;
  }

  if (activity.simulatorProcessScores.length > 0) {
    const avg =
      activity.simulatorProcessScores.reduce((s, n) => s + n, 0) /
      activity.simulatorProcessScores.length;
    score += Math.round(avg * 0.2);
  }

  // Light volume bonus for multi-loop days (still process, not profit).
  if (activity.eventCount >= 4) score += 8;
  if (activity.journalCompletions > 0 && activity.researchSessions > 0) score += 6;

  return clamp(score);
}

export function levelFromIntensity(intensity: number, hasActivity: boolean): HeatmapProcessLevel {
  if (!hasActivity || intensity <= 0) return 'none';
  if (intensity < 40) return 'learning';
  if (intensity < 70) return 'good';
  return 'excellent';
}

export function heatmapLevelColorToken(level: HeatmapProcessLevel): {
  label: string;
  /** Tailwind-ish semantic for UI mapping */
  tone: 'muted' | 'info' | 'accent' | 'bullish';
} {
  switch (level) {
    case 'none':
      return { label: 'No activity', tone: 'muted' };
    case 'learning':
      return { label: 'Learning', tone: 'info' };
    case 'good':
      return { label: 'Good process', tone: 'accent' };
    case 'excellent':
      return { label: 'Excellent process', tone: 'bullish' };
  }
}

function mergeActivities(days: HeatmapDayActivity[], bucketDay: string): HeatmapDayActivity {
  const merged = emptyActivity(bucketDay);
  const dqs: number[] = [];
  for (const day of days) {
    merged.journalCompletions += day.journalCompletions;
    merged.replayCompletions += day.replayCompletions;
    merged.checklistUses += day.checklistUses;
    merged.researchSessions += day.researchSessions;
    merged.learningSessions += day.learningSessions;
    merged.academyEvents += day.academyEvents;
    merged.eventCount += day.eventCount;
    merged.simulatorProcessScores.push(...day.simulatorProcessScores);
    if (day.averageDecisionQuality != null) dqs.push(day.averageDecisionQuality);
  }
  merged.averageDecisionQuality =
    dqs.length === 0 ? null : dqs.reduce((s, n) => s + n, 0) / dqs.length;
  return merged;
}

function labelForBucket(key: string, period: HeatmapPeriod): string {
  if (period === 'daily') {
    const d = new Date(parseDayKey(key));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  if (period === 'weekly') {
    return `Week of ${new Date(parseDayKey(key)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  }
  if (period === 'monthly') {
    const d = new Date(parseDayKey(key));
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  return String(new Date(parseDayKey(key)).getUTCFullYear());
}

function daySpanForPeriod(period: HeatmapPeriod): number {
  if (period === 'weekly') return 7;
  if (period === 'monthly') return 30;
  if (period === 'yearly') return 365;
  return 1;
}

function enumerateBucketKeys(period: HeatmapPeriod, fromMs: number, toMs: number): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  if (period === 'daily') {
    for (let t = startOfUtcDay(fromMs); t <= toMs; t += MS_DAY) {
      const key = dayKeyFromMs(t);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    return keys;
  }

  if (period === 'weekly') {
    for (let t = startOfUtcDay(fromMs); t <= toMs; t += MS_DAY) {
      const key = weekKeyFromMs(t);
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
    return keys;
  }

  if (period === 'monthly') {
    const start = new Date(startOfUtcDay(fromMs));
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    const end = new Date(toMs);
    while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      keys.push(key);
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return keys;
  }

  const startYear = new Date(fromMs).getUTCFullYear();
  const endYear = new Date(toMs).getUTCFullYear();
  for (let y = startYear; y <= endYear; y += 1) {
    keys.push(`${y}-01-01`);
  }
  return keys;
}

export function computeHeatmapScores(
  cells: HeatmapCell[],
  dayMap: Map<string, HeatmapDayActivity>,
): HeatmapScores {
  const activeCells = cells.filter((c) => c.level !== 'none');
  const consistencyScore =
    cells.length === 0 ? 0 : clamp((activeCells.length / cells.length) * 100);

  let journal = 0;
  let replay = 0;
  let checklist = 0;
  let research = 0;
  let learning = 0;

  for (const activity of dayMap.values()) {
    journal += activity.journalCompletions;
    replay += activity.replayCompletions;
    checklist += activity.checklistUses;
    research += activity.researchSessions;
    learning += activity.learningSessions + activity.academyEvents;
  }

  const learningScore = clamp(
    (learning > 0 ? 25 : 0) +
      Math.min(35, learning * 4) +
      Math.min(20, replay * 8) +
      Math.min(20, checklist * 5),
  );

  const followThrough =
    research === 0 ? (journal > 0 ? 70 : 40) : clamp((journal / Math.max(1, research)) * 100);
  const disciplineScore = clamp(
    followThrough * 0.45 +
      Math.min(30, checklist * 8) +
      Math.min(25, replay * 6) +
      (consistencyScore >= 40 ? 10 : 0),
  );

  // Improvement: compare first vs second half cell intensities (process only).
  const mid = Math.floor(cells.length / 2);
  const first = cells.slice(0, mid);
  const second = cells.slice(mid);
  const avg = (list: HeatmapCell[]) =>
    list.length === 0 ? 0 : list.reduce((s, c) => s + c.processIntensity, 0) / list.length;
  const early = avg(first);
  const late = avg(second);
  const trendDelta = Math.round(late - early);
  let improvementTrend: HeatmapTrend = 'flat';
  if (trendDelta >= 8) improvementTrend = 'improving';
  else if (trendDelta <= -8) improvementTrend = 'slipping';

  return {
    consistencyScore,
    learningScore,
    disciplineScore,
    improvementTrend,
    trendDelta,
  };
}

function buildInsight(scores: HeatmapScores, totals: HeatmapSnapshot['totals']): string {
  if (totals.daysWithActivity === 0) {
    return 'No process activity in this range yet. Log research, journal, replay, or Academy practice to light the map — never graded on P&L.';
  }
  if (scores.improvementTrend === 'improving') {
    return `Process intensity is rising (+${scores.trendDelta}). Keep closing the loop with journal and replay.`;
  }
  if (scores.improvementTrend === 'slipping') {
    return `Process cadence cooled (${scores.trendDelta}). A short Mentor focus or one replay session can rebuild consistency.`;
  }
  if (scores.disciplineScore >= 70 && scores.consistencyScore >= 50) {
    return 'Steady process weeks — consistency and discipline are both healthy.';
  }
  if (totals.journalCompletions === 0 && totals.researchSessions > 0) {
    return 'Research without journaling — close the learning loop to raise Decision Quality tracking.';
  }
  return 'Process heatmap tracks habits, not trade outcomes. Aim for regular learning and checklist discipline.';
}

/**
 * Build a Decision Heatmap snapshot from existing Decision Log (+ optional enrichments).
 * Does not persist — pure derivation.
 */
export function buildDecisionHeatmap(input: HeatmapBuildInput): HeatmapSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const { fromMs, toMs } = periodRange(input.period, nowMs);
  const dayMap = aggregateHeatmapDays({
    records: input.records,
    fromMs,
    toMs,
    learningEvents: input.learningEvents,
    simulatorHistory: input.simulatorHistory,
  });

  const bucketKeys = enumerateBucketKeys(input.period, fromMs, toMs);
  const cells: HeatmapCell[] = bucketKeys.map((key) => {
    let days: HeatmapDayActivity[] = [];
    if (input.period === 'daily') {
      const row = dayMap.get(key);
      days = row ? [row] : [];
    } else {
      days = [...dayMap.values()].filter((d) => bucketKeyForPeriod(parseDayKey(d.day), input.period) === key);
    }
    const activity = mergeActivities(days, key);
    const processIntensity = scoreDayProcessIntensity(activity);
    const level = levelFromIntensity(processIntensity, activity.eventCount > 0);
    return {
      key,
      label: labelForBucket(key, input.period),
      level,
      processIntensity,
      activity,
      daySpan: daySpanForPeriod(input.period),
    };
  });

  const scores = computeHeatmapScores(cells, dayMap);

  const totals = {
    journalCompletions: 0,
    replayCompletions: 0,
    checklistUses: 0,
    researchSessions: 0,
    learningSessions: 0,
    academyEvents: 0,
    daysWithActivity: 0,
  };
  for (const activity of dayMap.values()) {
    totals.journalCompletions += activity.journalCompletions;
    totals.replayCompletions += activity.replayCompletions;
    totals.checklistUses += activity.checklistUses;
    totals.researchSessions += activity.researchSessions;
    totals.learningSessions += activity.learningSessions;
    totals.academyEvents += activity.academyEvents;
    if (activity.eventCount > 0) totals.daysWithActivity += 1;
  }

  return {
    period: input.period,
    fromMs,
    toMs,
    cells,
    scores,
    totals,
    insight: buildInsight(scores, totals),
  };
}

/** Convert Academy lesson progress timestamps into learning events. */
export function learningEventsFromAcademyLessons(
  lessons: Record<string, { readAt?: string; practicedAt?: string; completedAt?: string; lastOpenedAt?: string }>,
): HeatmapLearningEvent[] {
  const events: HeatmapLearningEvent[] = [];
  for (const progress of Object.values(lessons)) {
    if (progress.readAt || progress.completedAt) {
      const iso = progress.readAt ?? progress.completedAt!;
      events.push({ at: Date.parse(iso), kind: 'academy_read' });
    }
    if (progress.practicedAt) {
      events.push({ at: Date.parse(progress.practicedAt), kind: 'academy_practiced' });
    }
  }
  return events.filter((e) => Number.isFinite(e.at));
}
