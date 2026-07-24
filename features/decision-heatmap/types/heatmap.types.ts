/** Process-quality cell intensity — never maps to P&L. */
export type HeatmapProcessLevel = 'none' | 'learning' | 'good' | 'excellent';

export type HeatmapPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type HeatmapTrend = 'improving' | 'flat' | 'slipping';

export interface HeatmapDayActivity {
  /** Local calendar day key YYYY-MM-DD */
  day: string;
  journalCompletions: number;
  replayCompletions: number;
  checklistUses: number;
  researchSessions: number;
  learningSessions: number;
  academyEvents: number;
  /** Average Decision Quality when present on log rows. */
  averageDecisionQuality: number | null;
  /** Optional simulator process scores landing on this day. */
  simulatorProcessScores: number[];
  eventCount: number;
}

export interface HeatmapCell {
  /** Bucket start as YYYY-MM-DD (day / week start / month start / year start). */
  key: string;
  label: string;
  level: HeatmapProcessLevel;
  /** 0–100 process intensity for the bucket — never profit. */
  processIntensity: number;
  activity: HeatmapDayActivity;
  /** Inclusive day count covered by this cell. */
  daySpan: number;
}

export interface HeatmapScores {
  consistencyScore: number;
  learningScore: number;
  disciplineScore: number;
  improvementTrend: HeatmapTrend;
  trendDelta: number;
}

export interface HeatmapSnapshot {
  period: HeatmapPeriod;
  fromMs: number;
  toMs: number;
  cells: HeatmapCell[];
  scores: HeatmapScores;
  totals: {
    journalCompletions: number;
    replayCompletions: number;
    checklistUses: number;
    researchSessions: number;
    learningSessions: number;
    academyEvents: number;
    daysWithActivity: number;
  };
  insight: string;
}

export interface HeatmapLearningEvent {
  at: number;
  kind: 'academy_read' | 'academy_practiced' | 'academy_discipline' | 'simulator';
}

export interface HeatmapBuildInput {
  records: import('@/features/decision-log/services/decision-log.service').DecisionRecord[];
  period: HeatmapPeriod;
  nowMs?: number;
  learningEvents?: HeatmapLearningEvent[];
  /** Simulator history process scores with timestamps. */
  simulatorHistory?: { createdAt: number; processScore: number }[];
}
