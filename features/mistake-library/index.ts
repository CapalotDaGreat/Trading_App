export type {
  AnalyticsSafeMistakeSummary,
  ComposeMistakeLibraryInput,
  MistakeEvidenceKey,
  MistakeImprovementEvidence,
  MistakeImprovementTrend,
  MistakeLibrarySnapshot,
  MistakeObservation,
  MistakePatternId,
  MistakePatternRecord,
  MistakeRecommendationPriority,
  MistakeTrainingLink,
  MistakeTrainingLoop,
} from './types/mistake-library.types';

export { MISTAKE_LIBRARY_DISCLAIMER, MISTAKE_PATTERN_CATALOG, mistakePatternDefinition } from './content/mistake-pattern-catalog';

export {
  composeMistakeLibrary,
  emptyMistakeLibrary,
  hrefsRelated,
  mistakeLibraryContainsJudgmentalLanguage,
  observationalReasonForCandidate,
  patternMatchesTraining,
  plannerScoreDeltaForMistakeLibrary,
  preferredPracticeDrillIds,
  replayBoostFromMistakeLibrary,
  simulationFocusFromMistakeLibrary,
  toAnalyticsSafeMistakeSummary,
  trainingLinksForActivePatterns,
} from './services/mistake-library.service';

export { MistakeLibraryCard } from './components/MistakeLibraryCard';
