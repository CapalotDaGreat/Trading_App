import { createEvidenceRecord } from '@/features/competency';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useCompetencyEvidenceStore } from '@/features/competency/stores/competency-evidence.store';
import { useLearnerBehaviorStore } from '@/features/learner-model/stores/learner-behavior.store';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { DEMO_USER_UID } from '@/firebase/config';
import { ANALYTICS_PROP_KEYS } from '@/shared/services/analytics/events';

import {
  assertStructuredLearnerPayload,
  canSyncLearnerUid,
  payloadContainsSensitiveKeys,
  sanitizeEvidenceForCloud,
} from '../classification.service';
import { emptyProgressSnapshot, mergeLearnerBundles } from '../merge.service';
import { createMemoryLearnerCloud } from '../memory-cloud.port';
import { applyLearnerBundle, collectLearnerBundle } from '../snapshot.service';
import {
  isolateGuestProgressIfNeeded,
  persistAuthUid,
  readPersistedAuthUid,
  setLearnerStateCloudPort,
  syncLearnerState,
} from '../sync.service';
import { SENSITIVE_LEARNER_KEYS } from '../../types/learner-state.types';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');

function ev(uid: string, sourceId: string, conceptId = 'invalidation') {
  return createEvidenceRecord({
    uid,
    conceptId,
    sourceType: 'practice_drill',
    sourceId,
    occurredAt: NOW,
    independent: true,
    result: 'pass',
    processMetrics: { processQuality: 70, simulatedPnl: 12_000, simulatedProfitable: true },
  });
}

function resetStores() {
  useCompetencyEvidenceStore.getState().resetAll();
  useAcademyProgressStore.getState().setActiveUid(DEMO_USER_UID);
  useAcademyProgressStore.getState().resetProgress();
  usePracticeProgressStore.getState().setActiveUid(DEMO_USER_UID);
  usePracticeProgressStore.setState({ attempts: [], attemptsByUser: { [DEMO_USER_UID]: [] } });
  useLearningQueueStore.getState().setActiveUid(DEMO_USER_UID);
  useLearningQueueStore.getState().reset();
  useLearnerBehaviorStore.getState().resetAll();
}

describe('learner-state persistence', () => {
  beforeEach(() => {
    resetStores();
    setLearnerStateCloudPort(createMemoryLearnerCloud());
  });

  afterEach(() => {
    setLearnerStateCloudPort(null);
    void persistAuthUid('');
  });

  it('strips simulated P/L and journal prose from cloud evidence', () => {
    const record = ev('alice', 'drill-1');
    const cloud = sanitizeEvidenceForCloud(record);
    expect(cloud.processMetrics).not.toHaveProperty('simulatedPnl');
    expect(cloud.processMetrics).not.toHaveProperty('simulatedProfitable');
    expect(payloadContainsSensitiveKeys(cloud)).toBeNull();
    expect(() =>
      assertStructuredLearnerPayload({ notes: 'dear diary', uid: 'alice' }),
    ).toThrow(/sensitive key/i);
  });

  it('never syncs guest / demo-guest state', async () => {
    useCompetencyEvidenceStore.getState().recordEvidence(ev(DEMO_USER_UID, 'guest-drill'));
    const result = await syncLearnerState({
      authUid: DEMO_USER_UID,
      online: true,
      port: createMemoryLearnerCloud(),
    });
    expect(result.status).toBe('skipped');
    if (result.status === 'skipped') expect(result.reason).toBe('guest');
    expect(canSyncLearnerUid(DEMO_USER_UID)).toBe(false);
  });

  it('does not merge guest academy/practice into an authenticated user', () => {
    useAcademyProgressStore.getState().markCompleted('ta-candles');
    usePracticeProgressStore.getState().recordAttempt({ drillId: 'position-size', correct: true, selectedIndex: 0 });
    expect(isolateGuestProgressIfNeeded(DEMO_USER_UID, 'alice')).toBe(true);
    expect(useAcademyProgressStore.getState().lessons['ta-candles']).toBeUndefined();
    expect(usePracticeProgressStore.getState().attempts).toEqual([]);
  });

  it('does not carry device-global academy across authenticated users', () => {
    useAcademyProgressStore.getState().markCompleted('ta-candles');
    expect(isolateGuestProgressIfNeeded('alice', 'bob')).toBe(true);
    expect(useAcademyProgressStore.getState().lessons['ta-candles']).toBeUndefined();
    expect(isolateGuestProgressIfNeeded(null, 'alice')).toBe(false);
  });

  it('clears guest academy after a process restart using the persisted last uid', async () => {
    await persistAuthUid(DEMO_USER_UID);
    useAcademyProgressStore.getState().markCompleted('ta-candles');
    const previous = await readPersistedAuthUid();
    expect(previous).toBe(DEMO_USER_UID);
    expect(isolateGuestProgressIfNeeded(previous, 'alice')).toBe(true);
    expect(useAcademyProgressStore.getState().lessons['ta-candles']).toBeUndefined();
  });

  it('restores guest academy when switching back to demo-guest', () => {
    useAcademyProgressStore.getState().setActiveUid(DEMO_USER_UID);
    useAcademyProgressStore.getState().markCompleted('ta-candles');
    expect(isolateGuestProgressIfNeeded(DEMO_USER_UID, 'alice')).toBe(true);
    expect(useAcademyProgressStore.getState().lessons['ta-candles']).toBeUndefined();
    expect(isolateGuestProgressIfNeeded('alice', DEMO_USER_UID)).toBe(true);
    expect(useAcademyProgressStore.getState().isRead('ta-candles')).toBe(true);
  });

  it('restores evidence after a simulated reinstall', async () => {
    const port = createMemoryLearnerCloud();
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'keep-me'));
    useAcademyProgressStore.getState().setActiveUid('alice');
    useAcademyProgressStore.getState().markCompleted('dec-invalidation');
    const first = await syncLearnerState({ authUid: 'alice', online: true, now: NOW, port });
    expect(first.status).toBe('synced');

    resetStores();
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')).toEqual([]);

    const restored = await syncLearnerState({ authUid: 'alice', online: true, now: NOW + 1, port });
    expect(restored.status).toBe('synced');
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice').map((row) => row.sourceId)).toContain('keep-me');
    expect(useAcademyProgressStore.getState().isRead('dec-invalidation')).toBe(true);
  });

  it('merges local and other-device cloud evidence without dropping either side', async () => {
    const port = createMemoryLearnerCloud();
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'device-a'));
    await syncLearnerState({ authUid: 'alice', online: true, now: NOW, port });

    resetStores();
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'device-b', 'thesis'));
    const result = await syncLearnerState({ authUid: 'alice', online: true, now: NOW + 2, port });
    expect(result.status).toBe('synced');
    const ids = useCompetencyEvidenceStore.getState().evidenceFor('alice').map((row) => row.sourceId);
    expect(ids).toEqual(expect.arrayContaining(['device-a', 'device-b']));
  });

  it('keeps cloud evidence when the progress document is missing', async () => {
    const port = createMemoryLearnerCloud();
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'keep-me'));
    await syncLearnerState({ authUid: 'alice', online: true, now: NOW, port });
    const bucket = port.store.get('alice');
    if (bucket) bucket.progress = null;
    resetStores();
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'device-b', 'thesis'));
    const result = await syncLearnerState({ authUid: 'alice', online: true, now: NOW + 3, port });
    expect(result.status).toBe('synced');
    const ids = useCompetencyEvidenceStore.getState().evidenceFor('alice').map((row) => row.sourceId);
    expect(ids).toEqual(expect.arrayContaining(['keep-me', 'device-b']));
  });

  it('queues while offline and does not throw', async () => {
    useCompetencyEvidenceStore.getState().recordEvidence(ev('alice', 'offline-1'));
    const result = await syncLearnerState({
      authUid: 'alice',
      online: false,
      port: createMemoryLearnerCloud(),
    });
    expect(result).toEqual({ status: 'queued', reason: 'offline' });
    expect(useCompetencyEvidenceStore.getState().evidenceFor('alice')).toHaveLength(1);
  });

  it('refuses to apply another user\'s snapshot', () => {
    const bundle = {
      progress: emptyProgressSnapshot('bob'),
      evidence: [sanitizeEvidenceForCloud(ev('bob', 'x'))],
    };
    expect(() => applyLearnerBundle('alice', bundle)).toThrow(/different uid/i);
  });

  it('keeps unique academy progress from both sides in a conflict', () => {
    const local = collectLearnerBundle('alice', NOW);
    local.progress.academy.lessons['ta-candles'] = {
      completed: true,
      read: true,
      practiced: false,
      quizAttempts: 1,
      exerciseAttempts: 0,
    };
    const cloud = collectLearnerBundle('alice', NOW);
    cloud.progress.uid = 'alice';
    cloud.progress.academy.lessons['dec-thesis'] = {
      completed: false,
      read: true,
      practiced: true,
      quizAttempts: 0,
      exerciseAttempts: 2,
    };
    const merged = mergeLearnerBundles('alice', local, cloud, NOW);
    expect(merged.progress.academy.lessons['ta-candles']?.read).toBe(true);
    expect(merged.progress.academy.lessons['dec-thesis']?.practiced).toBe(true);
    expect(payloadContainsSensitiveKeys(merged)).toBeNull();
  });
});

describe('analytics vs learner-state', () => {
  it('does not allow sensitive learner keys as analytics props', () => {
    for (const key of SENSITIVE_LEARNER_KEYS) {
      expect(ANALYTICS_PROP_KEYS).not.toContain(key);
    }
  });
});
