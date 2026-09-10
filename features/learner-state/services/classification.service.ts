import { DEMO_USER_UID } from '@/firebase/config';
import type { CompetencyEvidenceRecord } from '@/features/competency';
import type { QueueDisposition } from '@/features/learning-engine/types/learning-engine.types';

import {
  SENSITIVE_LEARNER_KEYS,
  type CloudEvidenceRecord,
  type LearnerProgressSnapshot,
} from '../types/learner-state.types';

const SENSITIVE = new Set<string>(SENSITIVE_LEARNER_KEYS);

export function canSyncLearnerUid(uid: string | null | undefined): boolean {
  return Boolean(uid && uid.trim() && uid !== DEMO_USER_UID);
}

export function payloadContainsSensitiveKeys(value: unknown, path = ''): string | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const hit = payloadContainsSensitiveKeys(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE.has(key)) return path ? `${path}.${key}` : key;
    const hit = payloadContainsSensitiveKeys(nested, path ? `${path}.${key}` : key);
    if (hit) return hit;
  }
  return null;
}

function omitSensitiveProcessMetrics(
  metrics: CompetencyEvidenceRecord['processMetrics'],
): CloudEvidenceRecord['processMetrics'] | undefined {
  if (!metrics) return undefined;
  const {
    simulatedPnl: _pnl,
    simulatedProfitable: _profitable,
    ...rest
  } = metrics;
  return rest;
}

export function sanitizeEvidenceForCloud(
  record: CompetencyEvidenceRecord | CloudEvidenceRecord,
): CloudEvidenceRecord {
  return {
    id: record.id,
    eventKey: record.eventKey,
    uid: record.uid,
    conceptId: record.conceptId,
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    occurredAt: record.occurredAt,
    result: record.result,
    difficulty: record.difficulty,
    hintsUsed: record.hintsUsed,
    helpLevel: record.helpLevel,
    independent: record.independent,
    processMetrics: omitSensitiveProcessMetrics(record.processMetrics),
    scenarioContext: record.scenarioContext,
    assetClass: record.assetClass,
    interactingConceptIds: record.interactingConceptIds,
    transferDistance: record.transferDistance,
    evidenceLayer: record.evidenceLayer,
    journalSignals: record.journalSignals,
    reliability: record.reliability,
    score: record.score,
    version: record.version,
  };
}

export function sanitizeQueueDispositions(
  dispositions: Record<string, QueueDisposition | LearnerProgressSnapshot['queue']['dispositions'][string]>,
): LearnerProgressSnapshot['queue']['dispositions'] {
  const next: LearnerProgressSnapshot['queue']['dispositions'] = {};
  for (const [id, row] of Object.entries(dispositions)) {
    const { lastDeferReason: _reason, ...rest } = row as typeof row & { lastDeferReason?: string };
    next[id] = rest;
  }
  return next;
}

export function assertStructuredLearnerPayload(payload: unknown): void {
  const hit = payloadContainsSensitiveKeys(payload);
  if (hit) {
    throw new Error(`Learner-state payload contains sensitive key: ${hit}`);
  }
}
