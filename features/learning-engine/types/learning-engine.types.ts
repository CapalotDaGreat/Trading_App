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
  | 'curriculum'
  | 'varied_practice';

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

export interface TrainingHandoff {
  conceptId: string;
  loopStep: TrainingLoopStep;
  concealConcept: boolean;
  priority: TrainingPriority;
  whyToday: string;
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
}

export interface EasySessionGrinding {
  grinding: boolean;
  easySessions: number;
  independentApplications: number;
  reason: string | null;
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
}
