import type {
  PracticeStage,
  PracticeTransferStep,
  TargetComplexity,
  TodaysTraining,
  TrainingEmptyState,
  TrainingLoopStep,
  TrainingPriority,
  TrainingQueueItem,
  TrainingQueueKind,
} from '@/features/learning-engine/types/learning-engine.types';

export type TrainingActivityType =
  | 'lesson'
  | 'practice'
  | 'replay'
  | 'simulation'
  | 'journal'
  | 'review'
  | 'event'
  | 'exploration';

export type PlannerPriorityBand =
  | 'critical_remediation'
  | 'overdue_redemonstration'
  | 'in_progress_application'
  | 'weak_competency'
  | 'transfer_practice'
  | 'event_driven'
  | 'new_curriculum'
  | 'varied_practice'
  | 'optional_exploration';

export type TrainingSessionLength = 'quick' | 'normal' | 'deep';

export interface TrainingRecommendation {
  id: string;
  activityType: TrainingActivityType;
  conceptId?: string;
  title: string;
  href: string;
  reason: string;
  priority: TrainingPriority;
  band: PlannerPriorityBand;
  /** Internal ranking only — never shown in UI. */
  score: number;
  difficulty: TargetComplexity;
  estimatedMinutes: number;
  expectedTrainingValue: number;
  prerequisiteReady: boolean;
  isRemediation: boolean;
  isRedemonstration: boolean;
  isTransferPractice: boolean;
  isEventDriven: boolean;
  isOptional: boolean;
  deferralEligible: boolean;
  dueAt?: number;
  kind: TrainingQueueKind;
  loopStep?: TrainingLoopStep;
  concealConcept?: boolean;
  evidence: string[];
  transferStep?: PracticeTransferStep;
  showHints?: boolean;
  showExamples?: boolean;
}

export interface TrainingPlan {
  uid: string;
  sessionLength: TrainingSessionLength;
  sessionBudgetMinutes: number;
  generatedAt: number;
  primary: TrainingRecommendation | null;
  queue: TrainingRecommendation[];
  whyPrimary: string;
  headline: string;
  coachLine: string;
  emptyState?: TrainingEmptyState;
  stage: PracticeStage;
  today: TodaysTraining;
}

export function recommendationToQueueItem(row: TrainingRecommendation): TrainingQueueItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    reason: row.reason,
    whyToday: row.reason,
    evidence: row.evidence,
    href: row.href,
    conceptId: row.conceptId,
    complexity: row.difficulty,
    loopStep: row.loopStep,
    priority: row.priority,
    concealConcept: row.concealConcept,
    transferStep: row.transferStep,
    showHints: row.showHints,
    showExamples: row.showExamples,
    estimatedMinutes: row.estimatedMinutes,
    expectedTrainingValue: row.expectedTrainingValue,
    prerequisiteReady: row.prerequisiteReady,
    isRemediation: row.isRemediation,
    isRedemonstration: row.isRedemonstration,
    isTransferPractice: row.isTransferPractice,
    isEventDriven: row.isEventDriven,
    isOptional: row.isOptional,
    deferralEligible: row.deferralEligible,
    dueAt: row.dueAt,
  };
}
