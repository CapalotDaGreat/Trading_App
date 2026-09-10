import type { SkillDomain } from '@/shared/constants/skill-domains';
import type { JournalMistakeCategory } from '@/features/journal/types/journal.types';
import type { MarketEventKind } from '@/features/events/types/events.types';

/** Demonstrated state — never “mastered” from reading a lesson. */
export type ConceptMasteryState =
  | 'not_started'
  | 'exposed'
  | 'practicing'
  | 'developing'
  | 'demonstrated';

export type FocusTone = 'area_to_improve' | 'developing_skill' | 'practice_opportunity';

export type TrainingQueueKind =
  | 'continue_lesson'
  | 'review_concept'
  | 'chart_exercise'
  | 'historical_replay'
  | 'simulation_challenge'
  | 'journal_review'
  | 'spaced_review'
  | 'event_prep'
  | 'remediation'
  | 'redemonstration';

export type TrainingLoopStep =
  | 'learn'
  | 'demonstrate'
  | 'practice'
  | 'apply'
  | 'review'
  | 'remediate'
  | 'redemonstrate';

export type TrainingPriority =
  | 'remediation'
  | 'redemonstration'
  | 'in_progress'
  | 'weak_competency'
  | 'transfer_practice'
  | 'event_driven'
  | 'curriculum'
  | 'varied_practice'
  | 'optional_exploration';

/** Conceptual challenge — not longer copy. */
export type TargetComplexity = 'foundations' | 'applied' | 'complex';

export interface LearningConceptNode {
  id: string;
  title: string;
  relatedIds: string[];
  /** Optional classroom walk, e.g. RSI → momentum → chart interpretation. */
  examplePath?: string[];
  skillDomain: SkillDomain;
  lessonIds: string[];
  drillIds: string[];
  replayIds: string[];
  simulateHref: string;
  journalMistakes?: JournalMistakeCategory[];
  eventKinds?: MarketEventKind[];
}

export interface ConceptMastery {
  conceptId: string;
  title: string;
  state: ConceptMasteryState;
  /** Null when the only signal is that a lesson was read. */
  score: number | null;
  evidence: string[];
  lastPracticedAt: number | null;
  lastSuccessAt: number | null;
  successCount: number;
  nextDueAt: number | null;
}

export interface FocusArea {
  tone: FocusTone;
  title: string;
  explanation: string;
  evidence: string[];
  href: string;
  conceptId: string;
}

export type AdaptiveStage =
  | 'guided_recognition'
  | 'independent_application'
  | 'unfamiliar_application'
  | 'mixed_complexity'
  | 'deliberate_practice';

/** Same ladder as competency TransferKind, without the legacy `new_presentation` alias. */
export type PracticeTransferStep =
  | 'same_format'
  | 'new_example'
  | 'new_condition'
  | 'new_asset'
  | 'mixed_concept'
  | 'concealed_scenario';

export interface DifficultyDimensions {
  scaffolding: 'full' | 'hints' | 'examples_only' | 'none';
  information: 'obvious' | 'partial' | 'ambiguous';
  competingConcepts: 0 | 1 | 2;
  timePressure: 'none' | 'soft' | 'educational';
  eventContext: boolean;
  conflictingEvidence: boolean;
  unfamiliarAsset: boolean;
  regimeShift: boolean;
  simultaneousRisks: 1 | 2 | 3;
}

export interface TrainingHandoff {
  conceptId: string;
  loopStep: TrainingLoopStep;
  concealConcept: boolean;
  priority: TrainingPriority;
  whyToday: string;
  transferStep?: PracticeTransferStep;
  showHints?: boolean;
  showExamples?: boolean;
}

export type TrainingEmptyState =
  | 'new_user'
  | 'sim_no_journal'
  | 'weak_competency'
  | 'strong_mixed'
  | 'standard';

/** Long-term journey stage. Derived — not a separate screen. */
export type PracticeStage =
  | 'foundation'
  | 'application'
  | 'integration'
  | 'deliberate'
  | 'maintenance';

export interface ScaffoldingPolicy {
  stage: PracticeStage;
  nameConcept: boolean;
  showHints: boolean;
  guidedQuestions: boolean;
  showExamples: boolean;
  concealConcept: boolean;
  mixedConcepts: boolean;
  incompleteInformation: boolean;
  competingExplanations: boolean;
  timePressure: 'none' | 'soft' | 'educational';
}

export interface EasySessionGrinding {
  grinding: boolean;
  easySessions: number;
  questionSessions: number;
  simulationSessions: number;
  independentApplications: number;
  reason: string | null;
}

export interface PracticeStagePolicy {
  stage: PracticeStage;
  complexity: TargetComplexity;
  preferredLoop: TrainingLoopStep;
  reviewIntervalMultiplier: number;
  minTransferStep: PracticeTransferStep;
  interleaveRelated: boolean;
  concealByDefault: boolean;
}

export interface TrainingQueueItem {
  id: string;
  kind: TrainingQueueKind;
  title: string;
  reason: string;
  /** Explainable “why this is today’s training”. */
  whyToday?: string;
  evidence: string[];
  href: string;
  conceptId?: string;
  complexity?: TargetComplexity;
  loopStep?: TrainingLoopStep;
  priority?: TrainingPriority;
  concealConcept?: boolean;
  estimatedMinutes?: number;
  expectedTrainingValue?: number;
  prerequisiteReady?: boolean;
  isRemediation?: boolean;
  isRedemonstration?: boolean;
  isTransferPractice?: boolean;
  isEventDriven?: boolean;
  isOptional?: boolean;
  deferralEligible?: boolean;
  dueAt?: number;
  transferStep?: PracticeTransferStep;
  showHints?: boolean;
  showExamples?: boolean;
}

export interface LessonNextChain {
  lessonId: string;
  lessonTitle: string;
  steps: TrainingQueueItem[];
  reminder: string;
}

export interface TodaysTraining {
  headline: string;
  coachLine: string;
  items: TrainingQueueItem[];
  focusAreas: FocusArea[];
  lessonChain: LessonNextChain | null;
  emptyState?: TrainingEmptyState;
  stage: PracticeStage;
}

export interface QueueDisposition {
  skippedUntil?: number;
  deferredUntil?: number;
  bookmarked?: boolean;
  deferCount?: number;
  skipCount?: number;
  /** Why the learner deferred — never treated as a failure. */
  lastDeferReason?: string;
  lastDeferredAt?: number;
}
