export type {
  CloudEvidenceRecord,
  LearnerProgressSnapshot,
  LearnerReplaySnapshot,
  LearnerSimulationMeta,
  LearnerStateBundle,
  LearnerStateClass,
  LearnerStateCloudPort,
  LearnerSyncResult,
  LearnerSyncSkipReason,
} from './types/learner-state.types';
export {
  LEARNER_STATE_SCHEMA_VERSION,
  LEARNER_SYNC_QUEUE_KEY,
  SENSITIVE_LEARNER_KEYS,
} from './types/learner-state.types';

export {
  assertStructuredLearnerPayload,
  canSyncLearnerUid,
  payloadContainsSensitiveKeys,
  sanitizeEvidenceForCloud,
  sanitizeQueueDispositions,
} from './services/classification.service';
export { emptyProgressSnapshot, mergeEvidenceRecords, mergeLearnerBundles } from './services/merge.service';
export { applyLearnerBundle, collectLearnerBundle } from './services/snapshot.service';
export {
  LAST_AUTH_UID_KEY,
  clearLearnerSyncPending,
  hasLearnerSyncPending,
  isolateGuestProgressIfNeeded,
  markLearnerSyncPending,
  persistAuthUid,
  readPersistedAuthUid,
  setLearnerStateCloudPort,
  syncLearnerState,
} from './services/sync.service';
export { createMemoryLearnerCloud } from './services/memory-cloud.port';
export { useLearnerStateSync } from './hooks/useLearnerStateSync';
