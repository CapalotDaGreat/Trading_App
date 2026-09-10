export type {
  CompetenceState,
  CompetencyAssetClass,
  CompetencyConcept,
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  CompetencyFamily,
  CompetencyMastery,
  CompetencyMasteryState,
  CompetencyScenarioContext,
  CompetencyUserLabel,
  ConceptImportance,
  DemonstrationPrompt,
  DemonstrationRecipe,
  EvidenceDifficulty,
  EvidenceQuality,
  EvidenceResult,
  EvidenceRole,
  EvidenceLayer,
  HelpLevel,
  JournalEvidenceSignals,
  MisconceptionHint,
  ProcessMetrics,
  RecordEvidenceResult,
  RemediationPlan,
  RevisitKind,
  TaxonomyValidation,
  ThesisSpecificity,
  TransferDistance,
  TransferEvidenceSummary,
  TransferKind,
} from './types/competency.types';

export {
  COMPETENCY_CONCEPTS,
  COMPETENCY_FAMILIES,
  FORBIDDEN_MASTERY_TERMS,
  REQUIRED_CONCEPT_GROUPS,
} from './content/competency-taxonomy';

export { recipeFor } from './content/demonstration-recipes';

export {
  DRILL_CONCEPT_IDS,
  DRILL_TO_CONCEPT,
  EVENT_DRILL_IDS,
  LESSON_CONCEPT_IDS,
  LESSON_PRIMARY_CONCEPT,
  REVIEW_ACTION_CONCEPTS,
  SURPRISE_REPLAY_IDS,
  TRANSFER_DRILL_IDS,
  conceptsForDrill,
  conceptsForLesson,
  isEventDrill,
  isSurpriseReplay,
  isTransferDrill,
} from './content/activity-concept-map';

export {
  allCompetencyConcepts,
  conceptsInFamily,
  getCompetencyConcept,
  resolveCompetencyId,
  validateTaxonomy,
} from './services/taxonomy.service';

export {
  COMPETENCY_EVIDENCE_VERSION,
  DEFAULT_RELIABILITY,
  createEvidenceForConcepts,
  createEvidenceRecord,
  defaultEventKey,
  deriveEvidenceLayer,
  deriveTransferDistance,
  helpWasUsed,
  isApplicationSource,
  isExposureOnlyRecord,
  isExposureOnlySource,
  isIndependentEvidence,
  journalSignalCount,
  normalizeEvidenceRecord,
  resolveEvidenceResult,
  resolveHelpLevel,
} from './services/evidence.service';

export {
  COMPETENCY_DISCLAIMER,
  emptyCompetencyMastery,
  missingRecipeRoles,
  scoreAllCompetencyMastery,
  scoreCompetencyMastery,
} from './services/mastery.service';

export { scoreEvidenceQuality } from './services/quality.service';
export { scoreTransferEvidence, strongestEvidenceNote, detectFalseMastery, isFamiliarRecord } from './services/transfer.service';
export { computeRedemonstrationDueAt, forgettingRiskFromQuality } from './services/schedule.service';
export { inferScenarioContext, selectNextDemonstration, selectTransferContext, buildRemediationPlan, inferMisconception } from './services/context.service';
export { MASTERY_USER_LABELS, COMPETENCE_STATE_LABELS, userLabelFor } from './services/copy.service';

export {
  evidenceFromJournalReflection,
  evidenceFromKnowledgeCheck,
  evidenceFromLessonCompletion,
  evidenceFromPracticeDrill,
  evidenceFromReplayDecision,
  evidenceFromSimulationDecision,
  journalSignalsFromFields,
  sourceTypeForLessonExercise,
} from './services/ingest.service';

export {
  ingestEventExercise,
  ingestJournalReflection,
  ingestKnowledgeCheck,
  ingestLessonCompletion,
  ingestLessonExercise,
  ingestPracticeAttempt,
  ingestReplayDecision,
  ingestReplayCompletion,
  ingestReviewFinding,
  ingestSimulationCheckpoint,
  ingestSimulationDecision,
  ingestSurpriseAssessment,
  ingestTransferExercise,
} from './services/producers.service';

export {
  COMPETENCY_EVIDENCE_STORAGE_KEY,
  useCompetencyEvidenceStore,
} from './stores/competency-evidence.store';
