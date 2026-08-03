import type { DecisionLogSummary, DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { LabStats } from '@/features/decision-lab/types/lab.types';
import type {
  DecisionBrief,
  RiskCenterSnapshot,
  TraderMemory,
  TradingDna,
} from '@/features/decision/types/decision.types';
import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import type { SimulatorAction } from '@/features/decision-simulator/types/simulator.types';

import type { PassportCredential } from '../services/passport.service';

export type PassportTab = 'overview' | 'journey' | 'achievements';

export type PassportAchievementId =
  | 'journals_100'
  | 'replays_50'
  | 'disciplined_20'
  | 'academy_100'
  | 'checklist_streak_7'
  | 'patience_25'
  | 'risk_manager_10'
  | 'simulator_process_10'
  | 'heatmap_consistency_60';

export interface PassportAchievement {
  id: PassportAchievementId;
  title: string;
  detail: string;
  category: 'journal' | 'replay' | 'discipline' | 'academy' | 'patience' | 'risk' | 'process';
  target: number;
  progress: number;
  unlocked: boolean;
  earnedAt?: number;
  /** Celebrate process — never P&L. */
  celebrateCopy: string;
}

export interface PassportTrendPoint {
  key: string;
  label: string;
  decisionQualityAvg: number | null;
  researchValueAvg: number | null;
  processActivity: number;
}

export interface PassportPeriodSummary {
  key: string;
  label: string;
  fromMs: number;
  toMs: number;
  researched: number;
  journaled: number;
  replayed: number;
  skippedOrIgnored: number;
  academyEvents: number;
  avgDecisionQuality: number | null;
  avgResearchValue: number | null;
  insight: string;
}

export interface PassportTimelineEvent {
  id: string;
  at: number;
  title: string;
  detail: string;
  kind: 'habit' | 'quality' | 'learning' | 'achievement' | 'identity';
}

export interface PassportCounts {
  journals: number;
  replays: number;
  disciplinedActions: number;
  academyLessonsCompleted: number;
  academyLessonsPracticed: number;
  academyTotal: number;
  checklistCompletions: number;
  patienceActions: number;
  riskManagedCloses: number;
  simulatorSessions: number;
  labCloses: number;
  researchSessions: number;
}

export interface PassportLearningJourney {
  academyCompleted: number;
  academyPracticed: number;
  academyTotal: number;
  labCloses: number;
  labAvgProcess: number;
  simulatorSessions: number;
  journalCount: number;
  replayCount: number;
  milestones: string[];
}

export interface DecisionPassportProfile {
  generatedAt: number;
  /** Hero process strip from credential ledger + composed scores. */
  processSessions: number;
  averageProcessScore: number;
  lastAction?: SimulatorAction;
  credentials: PassportCredential[];

  identity: {
    styleLabel: string;
    riskTolerance: string;
    preferredAssets: string[];
    summary: string;
  };
  dna: TradingDna;
  learningJourney: PassportLearningJourney;
  strengths: string[];
  weaknesses: string[];
  bestMarketConditions: string[];
  decisionQualityTrend: PassportTrendPoint[];
  researchValueTrend: PassportTrendPoint[];
  psychologySummary: string;
  consistency: {
    heatmap?: HeatmapScores;
    processScoreWeek: number;
    streakDays: number;
    insight: string;
  };
  currentFocus: {
    headline: string;
    todaysFocus: string;
    improveNext: string;
  };
  mentorGoals: {
    currentGoal: string;
    challenge: string;
    academyLessonId?: string;
    academyTitle?: string;
    replayHref?: string;
    replayLabel?: string;
  };
  achievements: PassportAchievement[];
  learningMilestones: string[];
  replayHistory: { count: number; recentNotes: string[] };
  academyProgress: {
    completed: number;
    practiced: number;
    total: number;
    percent: number;
  };
  portfolioNote?: string;
  researchQueueNote?: string;
  monthlySummaries: PassportPeriodSummary[];
  yearlySummaries: PassportPeriodSummary[];
  timeline: PassportTimelineEvent[];
  exportReady: {
    status: 'ready' | 'stub';
    message: string;
  };
  counts: PassportCounts;
}

export interface BuildPassportProfileInput {
  credentials: PassportCredential[];
  processScores: number[];
  lastAction?: SimulatorAction;
  unlockedAchievementDates: Record<string, number>;
  mentor?: TradingMentorBrief | null;
  memory?: TraderMemory | null;
  heatmapScores?: HeatmapScores | null;
  logRecords: DecisionRecord[];
  logSummary?: DecisionLogSummary | null;
  journalCount: number;
  academyCompleted: number;
  academyPracticed: number;
  academyTotal: number;
  labStats?: LabStats | null;
  risk?: RiskCenterSnapshot | null;
  brief?: DecisionBrief | null;
  nowMs?: number;
}
