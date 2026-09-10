import type { PracticeStage, TrainingEmptyState } from '@/features/learning-engine/types/learning-engine.types';

import type { TrainingActivityType, TrainingRecommendation } from './training-planner.types';

export interface HomeInsightItem {
  title: string;
  note: string;
  href?: string;
}

export interface HomePersonalization {
  emptyState: TrainingEmptyState;
  stage: PracticeStage;
  /** Always the Unified Training Planner primary. */
  primary: TrainingRecommendation | null;
  todayTitle: string;
  todayKind: TrainingActivityType | null;
  whyThis: string;
  nextStep: HomeInsightItem | null;
  improving: HomeInsightItem[];
  keepAnEyeOn: HomeInsightItem | null;
  continueWork: HomeInsightItem | null;
  beginner: boolean;
  emptyPersonalization: boolean;
}

export interface ReviewJournalStats {
  count: number;
  withUsableNotes: number;
  withReflection: number;
  withProcessTag: number;
}

export interface ReviewSimulationContext {
  decisionCount: number;
  thesisBackedCount: number;
  closeReviewCount: number;
  processGaps: string[];
  processStrengths: string[];
  /** Simulated equity caption only — never a grade. */
  equityLabel?: string;
}

export interface ReviewActivityContext {
  journal: ReviewJournalStats;
  simulation?: ReviewSimulationContext;
  replayCompletedCount: number;
}

export interface ReviewBriefItem {
  title: string;
  note: string;
}

export interface ReviewBrief {
  empty: boolean;
  headline: string;
  processInsight: string;
  improvements: ReviewBriefItem[];
  unresolved: ReviewBriefItem[];
  evidenceQualityNote: string;
  journalQualityNote: string;
  simulationReflection: string | null;
  replayReflection: string | null;
  nextTraining: TrainingRecommendation | null;
}
