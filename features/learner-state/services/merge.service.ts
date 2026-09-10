import type { ConceptResult, LessonProgress } from '@/features/academy/stores/academy-progress.store';
import type { PracticeAttempt } from '@/features/practice/stores/practice-progress.store';
import type { QueueDisposition } from '@/features/learning-engine/types/learning-engine.types';
import type { LearnerBehaviorEvent, SelfConfidenceReport } from '@/features/learner-model';

import { sanitizeEvidenceForCloud, sanitizeQueueDispositions } from './classification.service';
import {
  LEARNER_STATE_SCHEMA_VERSION,
  type CloudEvidenceRecord,
  type LearnerProgressSnapshot,
  type LearnerReplaySnapshot,
  type LearnerSimulationMeta,
  type LearnerStateBundle,
} from '../types/learner-state.types';

const EVIDENCE_CAP = 800;
const PRACTICE_CAP = 200;
const BEHAVIOR_CAP = 400;
const CONFIDENCE_CAP = 40;

function laterIso(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function mergeLessonProgress(local: LessonProgress, cloud: LessonProgress): LessonProgress {
  return {
    completed: Boolean(local.completed || cloud.completed),
    read: Boolean(local.read || cloud.read),
    readAt: laterIso(local.readAt, cloud.readAt),
    completedAt: laterIso(local.completedAt, cloud.completedAt),
    practiced: Boolean(local.practiced || cloud.practiced),
    practicedAt: laterIso(local.practicedAt, cloud.practicedAt),
    lastPracticeHref: local.lastPracticeHref ?? cloud.lastPracticeHref,
    quizBestScore:
      local.quizBestScore != null || cloud.quizBestScore != null
        ? Math.max(local.quizBestScore ?? 0, cloud.quizBestScore ?? 0)
        : undefined,
    quizAttempts: Math.max(local.quizAttempts ?? 0, cloud.quizAttempts ?? 0),
    lastOpenedAt: laterIso(local.lastOpenedAt, cloud.lastOpenedAt),
    exerciseAttempts: Math.max(local.exerciseAttempts ?? 0, cloud.exerciseAttempts ?? 0),
  };
}

function mergeLessonMap(
  local: Record<string, LessonProgress>,
  cloud: Record<string, LessonProgress>,
): Record<string, LessonProgress> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const next: Record<string, LessonProgress> = {};
  for (const id of ids) {
    const a = local[id];
    const b = cloud[id];
    if (a && b) next[id] = mergeLessonProgress(a, b);
    else next[id] = (a ?? b)!;
  }
  return next;
}

function mergeConceptResults(
  local: Record<string, ConceptResult>,
  cloud: Record<string, ConceptResult>,
): Record<string, ConceptResult> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const next: Record<string, ConceptResult> = {};
  for (const id of ids) {
    const a = local[id];
    const b = cloud[id];
    if (a && b) {
      next[id] = {
        attempts: Math.max(a.attempts, b.attempts),
        misses: Math.max(a.misses, b.misses),
        lastAt: laterIso(a.lastAt, b.lastAt),
      };
    } else {
      next[id] = (a ?? b)!;
    }
  }
  return next;
}

function attemptKey(row: PracticeAttempt): string {
  return `${row.drillId}:${row.at}`;
}

export function mergePracticeAttempts(local: PracticeAttempt[], cloud: PracticeAttempt[]): PracticeAttempt[] {
  const byKey = new Map<string, PracticeAttempt>();
  for (const row of [...cloud, ...local]) {
    if (!byKey.has(attemptKey(row))) byKey.set(attemptKey(row), row);
  }
  return [...byKey.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-PRACTICE_CAP);
}

function mergeDisposition(
  local: QueueDisposition | undefined,
  cloud: QueueDisposition | undefined,
): QueueDisposition {
  return {
    skippedUntil: Math.max(local?.skippedUntil ?? 0, cloud?.skippedUntil ?? 0) || undefined,
    deferredUntil: Math.max(local?.deferredUntil ?? 0, cloud?.deferredUntil ?? 0) || undefined,
    bookmarked: Boolean(local?.bookmarked || cloud?.bookmarked) || undefined,
    deferCount: Math.max(local?.deferCount ?? 0, cloud?.deferCount ?? 0) || undefined,
    skipCount: Math.max(local?.skipCount ?? 0, cloud?.skipCount ?? 0) || undefined,
    lastDeferredAt: Math.max(local?.lastDeferredAt ?? 0, cloud?.lastDeferredAt ?? 0) || undefined,
    lastDeferReason: local?.lastDeferReason,
  };
}

function mergeDispositions(
  local: Record<string, QueueDisposition>,
  cloud: Record<string, QueueDisposition>,
): Record<string, QueueDisposition> {
  const ids = new Set([...Object.keys(local), ...Object.keys(cloud)]);
  const next: Record<string, QueueDisposition> = {};
  for (const id of ids) {
    next[id] = mergeDisposition(local[id], cloud[id]);
  }
  return next;
}

export function mergeEvidenceRecords(
  local: CloudEvidenceRecord[],
  cloud: CloudEvidenceRecord[],
): CloudEvidenceRecord[] {
  const byKey = new Map<string, CloudEvidenceRecord>();
  for (const row of [...cloud, ...local]) {
    if (!row.eventKey) continue;
    if (!byKey.has(row.eventKey)) byKey.set(row.eventKey, sanitizeEvidenceForCloud(row));
  }
  return [...byKey.values()].sort((a, b) => a.occurredAt - b.occurredAt).slice(-EVIDENCE_CAP);
}

function mergeReplay(local: LearnerReplaySnapshot, cloud: LearnerReplaySnapshot): LearnerReplaySnapshot {
  const completed = [...new Set([...cloud.completedEpisodeIds, ...local.completedEpisodeIds])];
  const best: Record<string, number> = { ...cloud.bestProcessByEpisode };
  for (const [id, score] of Object.entries(local.bestProcessByEpisode)) {
    best[id] = Math.max(best[id] ?? 0, score);
  }
  const mastery: LearnerReplaySnapshot['masteryByCollection'] = { ...cloud.masteryByCollection };
  for (const [id, count] of Object.entries(local.masteryByCollection ?? {})) {
    const key = id as keyof LearnerReplaySnapshot['masteryByCollection'];
    mastery[key] = Math.max(mastery[key] ?? 0, count);
  }
  return {
    completedEpisodeIds: completed,
    attemptCount: Math.max(local.attemptCount, cloud.attemptCount),
    bestProcessByEpisode: best,
    masteryByCollection: mastery,
  };
}

function mergeById<T extends { id: string }>(local: T[], cloud: T[], cap: number): T[] {
  const byId = new Map<string, T>();
  for (const row of [...cloud, ...local]) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return [...byId.values()].slice(-cap);
}

function mergeSimulation(local: LearnerSimulationMeta, cloud: LearnerSimulationMeta): LearnerSimulationMeta {
  const richer = local.decisionCount >= cloud.decisionCount ? local : cloud;
  return {
    hasAccount: local.hasAccount || cloud.hasAccount,
    clockDay: Math.max(local.clockDay, cloud.clockDay),
    decisionCount: richer.decisionCount,
    thesisBackedCount: Math.max(local.thesisBackedCount, cloud.thesisBackedCount),
    closeReviewCount: Math.max(local.closeReviewCount, cloud.closeReviewCount),
  };
}

export function emptyProgressSnapshot(uid: string, now = Date.now()): LearnerProgressSnapshot {
  return {
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    uid,
    revision: 0,
    updatedAt: now,
    academy: { lessons: {}, conceptResults: {}, savedLessonIds: [] },
    practiceAttempts: [],
    queue: { dispositions: {}, conceptDeferCounts: {}, sessionLength: null },
    replay: {
      completedEpisodeIds: [],
      attemptCount: 0,
      bestProcessByEpisode: {},
      masteryByCollection: {},
    },
    behaviorEvents: [],
    selfConfidence: [],
    simulationMeta: {
      hasAccount: false,
      clockDay: 0,
      decisionCount: 0,
      thesisBackedCount: 0,
      closeReviewCount: 0,
    },
  };
}

export function mergeLearnerBundles(
  uid: string,
  local: LearnerStateBundle,
  cloud: LearnerStateBundle | null,
  now = Date.now(),
): LearnerStateBundle {
  if (local.progress.uid !== uid) {
    throw new Error('Local learner snapshot uid does not match authenticated uid.');
  }
  if (cloud && cloud.progress.uid !== uid) {
    throw new Error('Cloud learner snapshot uid does not match authenticated uid.');
  }
  if (!cloud) {
    return {
      progress: {
        ...local.progress,
        uid,
        schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
        queue: { ...local.progress.queue, dispositions: sanitizeQueueDispositions(local.progress.queue.dispositions) },
        updatedAt: now,
        revision: Math.max(1, local.progress.revision),
      },
      evidence: mergeEvidenceRecords(local.evidence, []),
    };
  }

  const localCounts = { ...local.progress.queue.conceptDeferCounts };
  for (const [id, count] of Object.entries(cloud.progress.queue.conceptDeferCounts)) {
    localCounts[id] = Math.max(localCounts[id] ?? 0, count);
  }

  return {
    progress: {
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      uid,
      revision: Math.max(local.progress.revision, cloud.progress.revision) + 1,
      updatedAt: now,
      academy: {
        lessons: mergeLessonMap(local.progress.academy.lessons, cloud.progress.academy.lessons),
        conceptResults: mergeConceptResults(
          local.progress.academy.conceptResults,
          cloud.progress.academy.conceptResults,
        ),
        savedLessonIds: [...new Set([...cloud.progress.academy.savedLessonIds, ...local.progress.academy.savedLessonIds])],
      },
      practiceAttempts: mergePracticeAttempts(local.progress.practiceAttempts, cloud.progress.practiceAttempts),
      queue: {
        dispositions: sanitizeQueueDispositions(
          mergeDispositions(local.progress.queue.dispositions, cloud.progress.queue.dispositions),
        ),
        conceptDeferCounts: localCounts,
        sessionLength: local.progress.queue.sessionLength ?? cloud.progress.queue.sessionLength,
      },
      replay: mergeReplay(local.progress.replay, cloud.progress.replay),
      behaviorEvents: mergeById<LearnerBehaviorEvent>(
        local.progress.behaviorEvents,
        cloud.progress.behaviorEvents,
        BEHAVIOR_CAP,
      ),
      selfConfidence: mergeById<SelfConfidenceReport>(
        local.progress.selfConfidence,
        cloud.progress.selfConfidence,
        CONFIDENCE_CAP,
      ),
      simulationMeta: mergeSimulation(local.progress.simulationMeta, cloud.progress.simulationMeta),
    },
    evidence: mergeEvidenceRecords(local.evidence, cloud.evidence),
  };
}
