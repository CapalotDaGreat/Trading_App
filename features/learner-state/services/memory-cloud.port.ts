import type {
  CloudEvidenceRecord,
  LearnerProgressSnapshot,
  LearnerStateCloudPort,
} from '../types/learner-state.types';

/** In-memory cloud stand-in for reinstall / other-device tests. */
export function createMemoryLearnerCloud(): LearnerStateCloudPort & {
  store: Map<string, { progress: LearnerProgressSnapshot | null; evidence: CloudEvidenceRecord[] }>;
} {
  const store = new Map<string, { progress: LearnerProgressSnapshot | null; evidence: CloudEvidenceRecord[] }>();

  function bucket(uid: string) {
    const current = store.get(uid) ?? { progress: null, evidence: [] };
    store.set(uid, current);
    return current;
  }

  return {
    store,
    async getProgress(uid) {
      return bucket(uid).progress;
    },
    async getEvidence(uid) {
      return bucket(uid).evidence.slice();
    },
    async saveProgress(uid, progress) {
      if (progress.uid !== uid) throw new Error('Cloud uid mismatch.');
      bucket(uid).progress = progress;
    },
    async saveEvidence(uid, records) {
      const next = bucket(uid);
      const byKey = new Map(next.evidence.map((row) => [row.eventKey, row]));
      for (const row of records) {
        if (row.uid !== uid) continue;
        if (!byKey.has(row.eventKey)) byKey.set(row.eventKey, row);
      }
      next.evidence = [...byKey.values()];
    },
  };
}
