import type { ConceptResult, LessonProgress } from '@/features/academy/stores/academy-progress.store';
import type { CompetencyEvidenceRecord } from '@/features/competency';
import type { PracticeAttempt } from '@/features/practice/stores/practice-progress.store';
import type { QueueDisposition } from '@/features/learning-engine/types/learning-engine.types';
import type { TrainingSessionLength } from '@/features/training-planner/types/training-planner.types';
import type { LearnerBehaviorEvent, SelfConfidenceReport } from '@/features/learner-model';
import type { ReplayTvProgress } from '@/features/decision-replay-tv/types/replay-tv.types';

export const LEARNER_STATE_SCHEMA_VERSION = 1;

export type LearnerStateClass = 'safe_structured' | 'sensitive' | 'derived_not_stored';

/** Keys that must never appear on a cloud learner-state payload. */
export const SENSITIVE_LEARNER_KEYS = [
  'notes',
  'lessonsLearned',
  'improvementCommitment',
  'prompt',
  'messages',
  'reasoning',
  'draftReasoning',
  'reflection',
  'journalBody',
  'prose',
  'email',
  'equity',
  'cashBalance',
  'pnl',
  'pnlPercent',
  'simulatedPnl',
  'simulatedProfitable',
  'lastDeferReason',
  'averageCost',
  'currentPrice',
  'quantity',
] as const;

export interface CloudEvidenceRecord {
  id: string;
  eventKey: string;
  uid: string;
  conceptId: string;
  sourceType: CompetencyEvidenceRecord['sourceType'];
  sourceId: string;
  occurredAt: number;
  result: CompetencyEvidenceRecord['result'];
  difficulty: CompetencyEvidenceRecord['difficulty'];
  hintsUsed: boolean;
  helpLevel: CompetencyEvidenceRecord['helpLevel'];
  independent: boolean;
  processMetrics?: {
    processQuality?: number;
    thesis?: number;
    evidence?: number;
    invalidation?: number;
    risk?: number;
    discipline?: number;
    positionSizing?: number;
    uncertainty?: number;
    confirmation?: number;
    eventAwareness?: number;
    emotionalDiscipline?: number;
    reflection?: number;
    flags?: NonNullable<CompetencyEvidenceRecord['processMetrics']>['flags'];
  };
  scenarioContext?: CompetencyEvidenceRecord['scenarioContext'];
  assetClass?: CompetencyEvidenceRecord['assetClass'];
  interactingConceptIds?: string[];
  transferDistance: CompetencyEvidenceRecord['transferDistance'];
  evidenceLayer: CompetencyEvidenceRecord['evidenceLayer'];
  journalSignals?: CompetencyEvidenceRecord['journalSignals'];
  reliability: number;
  score?: number;
  version: 1 | 2;
}

export interface LearnerQueueSnapshot {
  dispositions: Record<string, Omit<QueueDisposition, 'lastDeferReason'>>;
  conceptDeferCounts: Record<string, number>;
  sessionLength: TrainingSessionLength | null;
}

export interface LearnerReplaySnapshot {
  completedEpisodeIds: string[];
  attemptCount: number;
  bestProcessByEpisode: Record<string, number>;
  masteryByCollection: ReplayTvProgress['masteryByCollection'];
}

export interface LearnerSimulationMeta {
  hasAccount: boolean;
  clockDay: number;
  decisionCount: number;
  thesisBackedCount: number;
  closeReviewCount: number;
}

export interface LearnerProgressSnapshot {
  schemaVersion: typeof LEARNER_STATE_SCHEMA_VERSION;
  uid: string;
  revision: number;
  updatedAt: number;
  academy: {
    lessons: Record<string, LessonProgress>;
    conceptResults: Record<string, ConceptResult>;
    savedLessonIds: string[];
  };
  practiceAttempts: PracticeAttempt[];
  queue: LearnerQueueSnapshot;
  replay: LearnerReplaySnapshot;
  behaviorEvents: LearnerBehaviorEvent[];
  selfConfidence: SelfConfidenceReport[];
  simulationMeta: LearnerSimulationMeta;
}

export interface LearnerStateBundle {
  progress: LearnerProgressSnapshot;
  evidence: CloudEvidenceRecord[];
}

export interface LearnerStateCloudPort {
  getProgress(uid: string): Promise<LearnerProgressSnapshot | null>;
  getEvidence(uid: string): Promise<CloudEvidenceRecord[]>;
  saveProgress(uid: string, progress: LearnerProgressSnapshot): Promise<void>;
  saveEvidence(uid: string, records: CloudEvidenceRecord[]): Promise<void>;
}

export type LearnerSyncSkipReason = 'guest' | 'unconfigured' | 'missing_uid' | 'uid_mismatch';

export type LearnerSyncResult =
  | { status: 'skipped'; reason: LearnerSyncSkipReason }
  | { status: 'queued'; reason: 'offline' }
  | { status: 'synced'; pulled: boolean; pushed: boolean; evidenceCount: number; revision: number };

export const LEARNER_SYNC_QUEUE_KEY = 'tradevision-learner-sync-queue-v1';
