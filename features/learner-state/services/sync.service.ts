import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { canUseFirestore } from '@/firebase/config';
import { logger } from '@/shared/services/observability/logger';
import { getLastReachability } from '@/shared/services/network/reachability';
import { useSettingsStore } from '@/shared/stores/settings.store';

import { assertStructuredLearnerPayload, canSyncLearnerUid } from './classification.service';
import { createFirestoreLearnerCloud } from './firestore-cloud.port';
import { emptyProgressSnapshot, mergeLearnerBundles } from './merge.service';
import { applyLearnerBundle, collectLearnerBundle } from './snapshot.service';
import {
  LEARNER_SYNC_QUEUE_KEY,
  type LearnerStateCloudPort,
  type LearnerSyncResult,
} from '../types/learner-state.types';

let cloudPort: LearnerStateCloudPort | null = null;
let inFlight: Promise<LearnerSyncResult> | null = null;

export function setLearnerStateCloudPort(port: LearnerStateCloudPort | null): void {
  cloudPort = port;
}

export const LAST_AUTH_UID_KEY = 'tradevision-last-auth-uid';

export async function readPersistedAuthUid(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_AUTH_UID_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function persistAuthUid(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_AUTH_UID_KEY, uid);
  } catch {
    // In-session isolation still uses the hook ref.
  }
}

export function isolateGuestProgressIfNeeded(previousUid: string | null, nextUid: string): boolean {
  if (!previousUid || previousUid === nextUid) return false;
  useAcademyProgressStore.getState().resetProgress();
  usePracticeProgressStore.setState({ attempts: [] });
  useLearningQueueStore.getState().reset();
  return true;
}

export function getLearnerStateCloudPort(): LearnerStateCloudPort {
  if (cloudPort) return cloudPort;
  cloudPort = createFirestoreLearnerCloud();
  return cloudPort;
}

export async function markLearnerSyncPending(uid: string): Promise<void> {
  await AsyncStorage.setItem(LEARNER_SYNC_QUEUE_KEY, JSON.stringify({ uid, pending: true, at: Date.now() }));
}

export async function clearLearnerSyncPending(): Promise<void> {
  await AsyncStorage.removeItem(LEARNER_SYNC_QUEUE_KEY);
}

export async function hasLearnerSyncPending(uid: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LEARNER_SYNC_QUEUE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { uid?: string; pending?: boolean };
    return parsed.pending === true && parsed.uid === uid;
  } catch {
    return false;
  }
}

export interface SyncLearnerStateInput {
  authUid: string;
  online?: boolean;
  now?: number;
  port?: LearnerStateCloudPort;
}

/**
 * Pull-merge-push. Never overwrites unique local or cloud evidence.
 * Guest / demo-guest is a no-op. Firestore paths use the Auth uid only.
 */
export async function syncLearnerState(input: SyncLearnerStateInput): Promise<LearnerSyncResult> {
  const uid = input.authUid.trim();
  if (!uid) return { status: 'skipped', reason: 'missing_uid' };
  if (!canSyncLearnerUid(uid)) {
    return { status: 'skipped', reason: 'guest' };
  }
  if (!input.port && !canUseFirestore(uid)) {
    return { status: 'skipped', reason: 'unconfigured' };
  }

  const online = input.online ?? getLastReachability();
  if (!online) {
    await markLearnerSyncPending(uid);
    return { status: 'queued', reason: 'offline' };
  }

  if (inFlight) return inFlight;
  inFlight = runSync(input, uid).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync(input: SyncLearnerStateInput, uid: string): Promise<LearnerSyncResult> {
  const port = input.port ?? getLearnerStateCloudPort();
  const now = input.now ?? Date.now();
  const local = collectLearnerBundle(uid, now);
  if (local.progress.uid !== uid) return { status: 'skipped', reason: 'uid_mismatch' };

  try {
    const [cloudProgress, cloudEvidence] = await Promise.all([port.getProgress(uid), port.getEvidence(uid)]);
    const safeCloudEvidence = cloudEvidence.filter((row) => row.uid === uid);
    const cloud =
      cloudProgress && cloudProgress.uid === uid
        ? { progress: cloudProgress, evidence: safeCloudEvidence }
        : safeCloudEvidence.length > 0
          ? { progress: emptyProgressSnapshot(uid, now), evidence: safeCloudEvidence }
          : null;
    const merged = mergeLearnerBundles(uid, local, cloud, now);
    assertStructuredLearnerPayload(merged);
    applyLearnerBundle(uid, merged);
    await port.saveProgress(uid, merged.progress);
    await port.saveEvidence(uid, merged.evidence);
    await clearLearnerSyncPending();
    useSettingsStore.getState().setLastSyncAt(now);
    return {
      status: 'synced',
      pulled: Boolean(cloud),
      pushed: true,
      evidenceCount: merged.evidence.length,
      revision: merged.progress.revision,
    };
  } catch (error) {
    logger.warn('learner_state.sync_failed', { error });
    await markLearnerSyncPending(uid);
    return { status: 'queued', reason: 'offline' };
  }
}
