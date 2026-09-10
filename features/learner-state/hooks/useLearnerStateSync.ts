import { useEffect, useRef } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useCompetencyEvidenceStore } from '@/features/competency/stores/competency-evidence.store';
import { canUseFirestore } from '@/firebase/config';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

import { isolateGuestProgressIfNeeded, syncLearnerState } from '../services/sync.service';

/**
 * Authenticated users: pull-merge-push structured learner state.
 * Guests stay local. Offline queues a retry.
 */
export function useLearnerStateSync() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { isOnline } = useOnlineStatus();
  const evidenceCount = useCompetencyEvidenceStore(
    (state) => (uid ? (state.recordsByUser[uid]?.length ?? 0) : 0),
  );
  const lessonCount = useAcademyProgressStore((state) => Object.keys(state.lessons).length);
  const lastUid = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    isolateGuestProgressIfNeeded(lastUid.current, uid);
    lastUid.current = uid;
    if (!canUseFirestore(uid)) return;
    void syncLearnerState({ authUid: uid, online: isOnline });
  }, [uid, isOnline]);

  useEffect(() => {
    if (!uid || !canUseFirestore(uid) || lastUid.current !== uid) return;
    const timer = setTimeout(() => {
      void syncLearnerState({ authUid: uid, online: isOnline });
    }, 4000);
    return () => clearTimeout(timer);
  }, [uid, evidenceCount, lessonCount, isOnline]);
}
