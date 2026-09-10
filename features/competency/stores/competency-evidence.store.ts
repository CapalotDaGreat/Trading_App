import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createDebouncedPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyMastery,
  RecordEvidenceResult,
} from '../types/competency.types';
import { createEvidenceRecord, normalizeEvidenceRecord } from '../services/evidence.service';
import { emptyCompetencyMastery, scoreCompetencyMastery } from '../services/mastery.service';
import { resolveCompetencyId } from '../services/taxonomy.service';

export const COMPETENCY_EVIDENCE_STORAGE_KEY = 'tradevision-competency-evidence-v1';

const PER_USER_CAP = 800;

interface CompetencyEvidenceState {
  recordsByUser: Record<string, CompetencyEvidenceRecord[]>;
  recordEvidence: (input: CompetencyEvidenceInput) => RecordEvidenceResult;
  recordMany: (inputs: CompetencyEvidenceInput[]) => RecordEvidenceResult[];
  importRecords: (uid: string, records: CompetencyEvidenceRecord[]) => number;
  evidenceFor: (uid: string, conceptId?: string) => CompetencyEvidenceRecord[];
  masteryFor: (uid: string, conceptId: string, now?: number) => CompetencyMastery;
  resetUser: (uid: string) => void;
  resetAll: () => void;
}

function scoped(recordsByUser: Record<string, CompetencyEvidenceRecord[]>, uid: string): CompetencyEvidenceRecord[] {
  return recordsByUser[uid] ?? [];
}

function migrateRecords(recordsByUser: Record<string, CompetencyEvidenceRecord[]> | undefined) {
  const next: Record<string, CompetencyEvidenceRecord[]> = {};
  for (const [uid, rows] of Object.entries(recordsByUser ?? {})) {
    next[uid] = rows.map((row) => {
      const normalized = normalizeEvidenceRecord(row);
      return {
        ...normalized,
        result: row.result,
        conceptId: row.conceptId,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        occurredAt: row.occurredAt,
      };
    });
  }
  return next;
}

export const useCompetencyEvidenceStore = create<CompetencyEvidenceState>()(
  persist(
    (set, get) => ({
      recordsByUser: {},

      recordEvidence: (input) => {
        let record: CompetencyEvidenceRecord;
        try {
          record = createEvidenceRecord(input);
        } catch (error) {
          return {
            status: 'rejected',
            reason: error instanceof Error ? error.message : 'Invalid competency evidence',
          };
        }

        const current = scoped(get().recordsByUser, record.uid);
        const existing = current.find((item) => item.eventKey === record.eventKey);
        if (existing) {
          return { status: 'duplicate', record: existing };
        }

        set({
          recordsByUser: {
            ...get().recordsByUser,
            [record.uid]: [...current, record].slice(-PER_USER_CAP),
          },
        });
        return { status: 'recorded', record };
      },

      recordMany: (inputs) => inputs.map((item) => get().recordEvidence(item)),

      importRecords: (uid, records) => {
        if (!uid.trim()) return 0;
        const current = scoped(get().recordsByUser, uid);
        const byKey = new Map(current.map((row) => [row.eventKey, row]));
        let added = 0;
        for (const record of records) {
          if (record.uid !== uid) continue;
          if (byKey.has(record.eventKey)) continue;
          byKey.set(record.eventKey, normalizeEvidenceRecord(record));
          added += 1;
        }
        if (!added) return 0;
        set({
          recordsByUser: {
            ...get().recordsByUser,
            [uid]: [...byKey.values()].sort((a, b) => a.occurredAt - b.occurredAt).slice(-PER_USER_CAP),
          },
        });
        return added;
      },

      evidenceFor: (uid, conceptId) => {
        const mine = scoped(get().recordsByUser, uid).map(normalizeEvidenceRecord);
        if (!conceptId) return mine.slice();
        const resolved = resolveCompetencyId(conceptId) ?? conceptId;
        return mine.filter((item) => item.conceptId === resolved);
      },

      masteryFor: (uid, conceptId, now) => {
        const resolved = resolveCompetencyId(conceptId);
        if (!resolved) return emptyCompetencyMastery(conceptId);
        return scoreCompetencyMastery(
          resolved,
          scoped(get().recordsByUser, uid).map(normalizeEvidenceRecord),
          now,
        );
      },

      resetUser: (uid) => {
        const next = { ...get().recordsByUser };
        delete next[uid];
        set({ recordsByUser: next });
      },

      resetAll: () => set({ recordsByUser: {} }),
    }),
    {
      name: COMPETENCY_EVIDENCE_STORAGE_KEY,
      storage: createDebouncedPersistedStorage(),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as { recordsByUser?: Record<string, CompetencyEvidenceRecord[]> };
        return {
          ...state,
          recordsByUser: migrateRecords(state.recordsByUser),
        };
      },
    },
  ),
);
