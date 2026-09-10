export type {
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
  ProcessMetrics,
  RecordEvidenceResult,
  RemediationPlan,
  TaxonomyValidation,
} from './types/competency.types';

export {
  COMPETENCY_CONCEPTS,
  COMPETENCY_FAMILIES,
  FORBIDDEN_MASTERY_TERMS,
  REQUIRED_CONCEPT_GROUPS,
} from './content/competency-taxonomy';

export { recipeFor } from './content/demonstration-recipes';

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
  isApplicationSource,
  isExposureOnlySource,
  resolveEvidenceResult,
} from './services/evidence.service';

export {
  COMPETENCY_DISCLAIMER,
  emptyCompetencyMastery,
  missingRecipeRoles,
  scoreAllCompetencyMastery,
  scoreCompetencyMastery,
} from './services/mastery.service';

export { scoreEvidenceQuality } from './services/quality.service';
export { computeRedemonstrationDueAt } from './services/schedule.service';
export { inferScenarioContext, selectNextDemonstration, selectTransferContext, buildRemediationPlan } from './services/context.service';
export { MASTERY_USER_LABELS, userLabelFor } from './services/copy.service';

export {
  evidenceFromJournalReflection,
  evidenceFromKnowledgeCheck,
  evidenceFromLessonCompletion,
  evidenceFromPracticeDrill,
  evidenceFromReplayDecision,
  evidenceFromSimulationDecision,
} from './services/ingest.service';

export {
  ingestJournalReflection,
  ingestKnowledgeCheck,
  ingestLessonCompletion,
  ingestLessonExercise,
  ingestPracticeAttempt,
  ingestReplayDecision,
  ingestReplayCompletion,
  ingestSimulationDecision,
} from './services/producers.service';

export {
  COMPETENCY_EVIDENCE_STORAGE_KEY,
  useCompetencyEvidenceStore,
} from './stores/competency-evidence.store';
