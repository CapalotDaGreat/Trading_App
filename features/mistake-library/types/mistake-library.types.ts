import type {
  CompetencyEvidenceType,
  CompetencyScenarioContext,
} from '@/features/competency';
import type { ScenarioFocus } from '@/features/simulation/types/scenario.types';

/**
 * Recurring decision-process patterns.
 * Educational IDs only — never mental-health diagnoses or personality labels.
 */
export type MistakePatternId =
  | 'fomo_chase'
  | 'premature_entry'
  | 'confirmation_seeking'
  | 'conviction_without_process'
  | 'insufficient_invalidation'
  | 'oversized_position'
  | 'unclear_thesis'
  | 'skipped_conflicting_evidence'
  | 'event_risk_neglect'
  | 'post_miss_cluster'
  | 'high_decision_frequency'
  | 'review_gap';

export type MistakeImprovementTrend = 'increasing' | 'stable' | 'improving';

export type MistakeRecommendationPriority = 'high' | 'medium' | 'low' | 'watch';

export type MistakeTrainingLoop = 'planner' | 'practice' | 'simulation' | 'replay' | 'review';

/** Structured detector key — never free-form journal text. */
export type MistakeEvidenceKey =
  | 'flags.fomoEntry'
  | 'flags.missingThesis'
  | 'flags.missingInvalidation'
  | 'flags.movedInvalidation'
  | 'flags.missingEvidence'
  | 'flags.exceededRiskLimit'
  | 'metrics.confirmation'
  | 'metrics.evidence'
  | 'metrics.eventAwareness'
  | 'metrics.emotionalDiscipline'
  | 'journal.thesisSpecificity'
  | 'journal.reflectionCompleted'
  | 'cluster.after_process_miss'
  | 'cluster.high_frequency'
  | 'gap.unreviewed_decision';

export interface MistakeTrainingLink {
  loop: MistakeTrainingLoop;
  href: string;
  label: string;
  reason: string;
}

export interface MistakeObservation {
  at: number;
  sourceType: CompetencyEvidenceType | 'behavior_cluster';
  sourceId: string;
  conceptIds: string[];
  scenarioContext?: CompetencyScenarioContext;
  evidenceKeys: MistakeEvidenceKey[];
}

export interface MistakeImprovementEvidence {
  at: number;
  sourceId: string;
  conceptId: string;
  scenarioContext?: CompetencyScenarioContext;
  /** True when the clearer process happened in a context not seen on the observations. */
  verifiedInNewContext: boolean;
}

export interface MistakePatternRecord {
  patternId: MistakePatternId;
  title: string;
  /** Observational copy. Never “you are an X trader.” */
  summary: string;
  trainingFocus: string;
  observations: MistakeObservation[];
  count: number;
  recentCount: number;
  recentOccurrences: number[];
  contexts: CompetencyScenarioContext[];
  affectedConcepts: string[];
  recencyScore: number;
  improvementTrend: MistakeImprovementTrend;
  recommendationPriority: MistakeRecommendationPriority;
  recommendedTraining: MistakeTrainingLink[];
  lastDemonstratedImprovement: MistakeImprovementEvidence | null;
}

export interface MistakeLibrarySnapshot {
  uid: string;
  generatedAt: number;
  patterns: MistakePatternRecord[];
  activePatternIds: MistakePatternId[];
  disclaimer: string;
}

export interface AnalyticsSafeMistakeSummary {
  surfacedPatternCount: number;
  improvingPatternCount: number;
  generatedAt: number;
}

export interface MistakeBehaviorEventInput {
  uid: string;
  type: string;
  occurredAt: number;
  activityKey?: string;
}

export interface ComposeMistakeLibraryInput {
  uid: string;
  records: readonly import('@/features/competency').CompetencyEvidenceRecord[];
  behaviorEvents?: readonly MistakeBehaviorEventInput[];
  now?: number;
}

export interface MistakePatternDefinition {
  id: MistakePatternId;
  title: string;
  trainingFocus: string;
  oneOffSummary: string;
  recurringSummary: string;
  affectedConcepts: string[];
  recommendedTraining: MistakeTrainingLink[];
  simulationFocus?: ScenarioFocus;
  replayConceptIds: string[];
  replayCollections: string[];
  practiceDrillIds: string[];
}
