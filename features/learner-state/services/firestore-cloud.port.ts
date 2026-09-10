import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { requireDb } from '@/firebase/config';
import { logger } from '@/shared/services/observability/logger';

import { assertStructuredLearnerPayload } from './classification.service';
import type {
  CloudEvidenceRecord,
  LearnerProgressSnapshot,
  LearnerStateCloudPort,
} from '../types/learner-state.types';

const USERS = 'users';
const STATE = 'learnerState';
const EVIDENCE = 'learnerEvidence';
const PROGRESS_ID = 'progress';
const BATCH = 400;

function evidenceDocId(eventKey: string): string {
  return eventKey.replace(/\//g, '_').slice(0, 700);
}

export function createFirestoreLearnerCloud(): LearnerStateCloudPort {
  return {
    async getProgress(uid) {
      const snap = await getDoc(doc(requireDb(), USERS, uid, STATE, PROGRESS_ID));
      if (!snap.exists()) return null;
      return snap.data() as LearnerProgressSnapshot;
    },
    async getEvidence(uid) {
      const snapshot = await getDocs(collection(requireDb(), USERS, uid, EVIDENCE));
      return snapshot.docs.map((row) => row.data() as CloudEvidenceRecord);
    },
    async saveProgress(uid, progress) {
      if (progress.uid !== uid) throw new Error('Cloud uid mismatch.');
      assertStructuredLearnerPayload(progress);
      await setDoc(doc(requireDb(), USERS, uid, STATE, PROGRESS_ID), JSON.parse(JSON.stringify(progress)));
    },
    async saveEvidence(uid, records) {
      const db = requireDb();
      let batch = writeBatch(db);
      let count = 0;
      for (const record of records) {
        if (record.uid !== uid) continue;
        assertStructuredLearnerPayload(record);
        batch.set(doc(db, USERS, uid, EVIDENCE, evidenceDocId(record.eventKey)), JSON.parse(JSON.stringify(record)));
        count += 1;
        if (count >= BATCH) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
    },
  };
}

export async function saveLearnerStateSafely(
  port: LearnerStateCloudPort,
  uid: string,
  progress: LearnerProgressSnapshot,
  evidence: CloudEvidenceRecord[],
): Promise<void> {
  try {
    await port.saveProgress(uid, progress);
    await port.saveEvidence(uid, evidence);
  } catch (error) {
    logger.warn('learner_state.save_failed', { error });
    throw error;
  }
}
