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
  | 'event_prep';

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

export interface TrainingQueueItem {
  id: string;
  kind: TrainingQueueKind;
  title: string;
  reason: string;
  evidence: string[];
  href: string;
  conceptId?: string;
  complexity?: TargetComplexity;
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
}

export interface QueueDisposition {
  skippedUntil?: number;
  deferredUntil?: number;
  bookmarked?: boolean;
}
