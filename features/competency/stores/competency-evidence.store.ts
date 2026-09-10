import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyMastery,
  RecordEvidenceResult,
} from '../types/competency.types';
import { createEvidenceRecord } from '../services/evidence.service';
import { emptyCompetencyMastery, scoreCompetencyMastery } from '../services/mastery.service';
import { resolveCompetencyId } from '../services/taxonomy.service';

export const COMPETENCY_EVIDENCE_STORAGE_KEY = 'tradevision-competency-evidence-v1';

const PER_USER_CAP = 800;

interface CompetencyEvidenceState {
  recordsByUser: Record<string, CompetencyEvidenceRecord[]>;
  recordEvidence: (input: CompetencyEvidenceInput) => RecordEvidenceResult;
  recordMany: (inputs: CompetencyEvidenceInput[]) => RecordEvidenceResult[];
  evidenceFor: (uid: string, conceptId?: string) => CompetencyEvidenceRecord[];
  masteryFor: (uid: string, conceptId: string, now?: number) => CompetencyMastery;
  resetUser: (uid: string) => void;
  resetAll: () => void;
}

function scoped(recordsByUser: Record<string, CompetencyEvidenceRecord[]>, uid: string): CompetencyEvidenceRecord[] {
  return recordsByUser[uid] ?? [];
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

      evidenceFor: (uid, conceptId) => {
        const mine = scoped(get().recordsByUser, uid);
        if (!conceptId) return mine.slice();
        const resolved = resolveCompetencyId(conceptId) ?? conceptId;
        return mine.filter((item) => item.conceptId === resolved);
      },

      masteryFor: (uid, conceptId, now) => {
        const resolved = resolveCompetencyId(conceptId);
        if (!resolved) return emptyCompetencyMastery(conceptId);
        return scoreCompetencyMastery(resolved, scoped(get().recordsByUser, uid), now);
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
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
