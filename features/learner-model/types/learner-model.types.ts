import type {
  CompetencyAssetClass,
  CompetencyEvidenceType,
  CompetencyMastery,
  CompetencyMasteryState,
  CompetencyScenarioContext,
  EvidenceLayer,
  HelpLevel,
} from '@/features/competency';
import type { MistakeLibrarySnapshot } from '@/features/mistake-library/types/mistake-library.types';

/**
 * Durable view of how the learner is developing.
 * Derived from the competency evidence ledger — not a second mastery engine.
 * Never a single “Trading Mastery %” trophy score.
 */
export type LearnerCompetenceState =
  | 'learning'
  | 'developing'
  | 'demonstrated'
  | 'strong'
  | 'needs_revisit'
  | 'transfer_unproven';

export const LEARNER_STATE_LABELS: Record<LearnerCompetenceState, string> = {
  learning: 'Learning',
  developing: 'Developing',
  demonstrated: 'Demonstrated',
  strong: 'Strong',
  needs_revisit: 'Needs Revisit',
  transfer_unproven: 'Transfer Unproven',
};

export type ScaffoldingLevel = 'keep' | 'fade' | 'independent';

export type LearnerBehaviorEventType =
  | 'session_start'
  | 'session_end'
  | 'activity_opened'
  | 'activity_abandoned'
  | 'explanation_opened'
  | 'retry'
  | 'help_used';

export interface LearnerBehaviorEvent {
  id: string;
  uid: string;
  type: LearnerBehaviorEventType;
  occurredAt: number;
  durationMs?: number;
  activityKey?: string;
  conceptId?: string;
  helpLevel?: HelpLevel;
}

export interface SelfConfidenceReport {
  id: string;
  uid: string;
  occurredAt: number;
  /** 0–100 self-report. Never mixed into competence. */
  value: number;
  conceptId?: string;
}

export interface LearnerKnowledgeSlice {
  understanding: number | null;
  knowledgeCheckPassRate: number | null;
  knowledgeCheckAttempts: number;
  misconceptionFlags: string[];
  prerequisiteGaps: string[];
}

export interface LearnerApplicationSlice {
  simulationDecisions: number;
  practiceAttempts: number;
  replayDecisions: number;
  appliedExercises: number;
  transferPasses: number;
  independentApplicationPasses: number;
  helpDependentPasses: number;
}

export interface LearnerDecisionQualitySlice {
  thesisClarity: number | null;
  evidenceQuality: number | null;
  invalidationDefinition: number | null;
  riskAwareness: number | null;
  positionSizingReasoning: number | null;
  uncertaintyRecognition: number | null;
  confirmationDiscipline: number | null;
  eventAwareness: number | null;
  emotionalDiscipline: number | null;
  postDecisionReflection: number | null;
}

export interface LearnerHelpMix {
  none: number;
  hint: number;
  example: number;
  worked_solution: number;
  repeated_explanation: number;
}

export interface LearnerBehaviorSlice {
  sessionCount: number;
  sessionFrequencyPerWeek: number | null;
  medianSessionDurationMs: number | null;
  retries: number;
  hintUsage: number;
  explanationUsage: number;
  independentCompletions: number;
  deferrals: number;
  abandonment: number;
  reviewEvents: number;
  spacedRedemonstrations: number;
  helpMix: LearnerHelpMix;
  scaffolding: ScaffoldingLevel;
}

export interface LearnerTransferSlice {
  familiarContexts: CompetencyScenarioContext[];
  unfamiliarContexts: CompetencyScenarioContext[];
  marketConditions: CompetencyScenarioContext[];
  assetClasses: CompetencyAssetClass[];
  multiConceptSourceIds: string[];
  proven: boolean;
}

export interface LearnerConceptState {
  conceptId: string;
  title: string;
  state: LearnerCompetenceState;
  label: string;
  masteryState: CompetencyMasteryState;
  knowledge: LearnerKnowledgeSlice;
  application: LearnerApplicationSlice;
  transfer: LearnerTransferSlice;
  helpMix: LearnerHelpMix;
  lastEvidenceAt: number | null;
  lastIndependentSuccessAt: number | null;
  evidenceStale: boolean;
  helpDependent: boolean;
  nextHref?: string;
  nextReason?: string;
}

export interface LearnerSelfConfidence {
  reportCount: number;
  latest: number | null;
  /** Always false unless several dated reports exist. Never inferred from process. */
  interpreted: boolean;
  note: string;
}

export interface LearnerExplanation {
  currentlyUnderstands: string[];
  demonstrated: string[];
  uncertain: string[];
  weak: string[];
  staleEvidence: string[];
  transferUnproven: string[];
  helpReliance: string;
  practiceNext: string[];
}

export interface LearnerPracticeSuggestion {
  conceptId: string;
  title: string;
  reason: string;
  href: string;
  state: LearnerCompetenceState;
}

export type ImprovementDirection = 'improving' | 'stable' | 'slipping' | 'insufficient';

export interface LongitudinalStrongestEvidence {
  sourceType: CompetencyEvidenceType;
  occurredAt: number;
  reliability: number;
  evidenceLayer?: EvidenceLayer;
}

export interface ConceptLongitudinalSlice {
  conceptId: string;
  firstEvidenceAt: number | null;
  strongestEvidence: LongitudinalStrongestEvidence | null;
  mostRecentEvidenceAt: number | null;
  evidenceDiversity: {
    contextCount: number;
    formatCount: number;
    assetClassCount: number;
    sourceIdCount: number;
  };
  recurringWeaknesses: string[];
  improvement: ImprovementDirection;
  transferProven: boolean;
  retention: {
    previouslyDemonstrated: boolean;
    dueForRedemonstration: boolean;
    recency: number | null;
  };
}

export interface LearnerLongitudinalProfile {
  firstEvidenceAt: number | null;
  mostRecentEvidenceAt: number | null;
  concepts: ConceptLongitudinalSlice[];
}

/** Earlier / recently / next copy from evidence. Never a trophy score. */
export interface DevelopmentHistoryView {
  conceptId: string;
  title: string;
  earlier: string;
  recently: string;
  next: string;
  href?: string;
}

export interface LearnerModelSnapshot {
  uid: string;
  generatedAt: number;
  concepts: LearnerConceptState[];
  decisionQuality: LearnerDecisionQualitySlice;
  behavior: LearnerBehaviorSlice;
  explanation: LearnerExplanation;
  nextPractice: LearnerPracticeSuggestion[];
  selfConfidence: LearnerSelfConfidence;
  mistakePatterns: MistakeLibrarySnapshot;
  longitudinal: LearnerLongitudinalProfile;
  developmentHistory: DevelopmentHistoryView | null;
  disclaimer: string;
}

export interface AnalyticsSafeLearnerSummary {
  conceptCount: number;
  countsByState: Record<LearnerCompetenceState, number>;
  helpMix: LearnerHelpMix;
  sessionCount: number;
  independentCompletions: number;
  generatedAt: number;
}

export interface MentorSafeLearnerSummary {
  states: Array<{ title: string; state: LearnerCompetenceState }>;
  understands: string[];
  weak: string[];
  stale: string[];
  transferUnproven: string[];
  helpReliance: string;
  practiceNext: string[];
  selfConfidenceSeparated: true;
}

export interface ComposeLearnerModelInput {
  uid: string;
  records: readonly import('@/features/competency').CompetencyEvidenceRecord[];
  now?: number;
  mastery?: CompetencyMastery[];
  dispositions?: Record<string, { deferCount?: number; skipCount?: number; lastDeferredAt?: number }>;
  conceptDeferCounts?: Record<string, number>;
  behaviorEvents?: readonly LearnerBehaviorEvent[];
  selfConfidenceReports?: readonly SelfConfidenceReport[];
}

export type LearnerEvidenceSource = CompetencyEvidenceType;
