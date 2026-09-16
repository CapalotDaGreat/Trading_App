import { useEffect, useState } from 'react';

import { useAuthOptional } from '@/features/auth/hooks/useAuth';
import { hasLearnerSyncPending } from '@/features/learner-state';
import { canUseFirestore, DEMO_USER_UID } from '@/firebase/config';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

export type ConnectivityKind = 'online' | 'offline' | 'sync_pending' | 'guest_local';

/**
 * User-facing connectivity for offline-first training.
 * Guests never pretend cloud sync exists.
 * Safe outside AuthProvider (banners in unit tests).
 */
export function useConnectivityStatus() {
  const auth = useAuthOptional();
  const uid = auth?.user?.uid;
  const authReady = auth !== null;
  const { isOnline, refresh } = useOnlineStatus();
  const [syncPending, setSyncPending] = useState(false);
  const isGuest = Boolean(authReady && (!uid || uid === DEMO_USER_UID));
  const cloudEligible = Boolean(uid && canUseFirestore(uid));

  useEffect(() => {
    if (!uid || !cloudEligible) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const pending = await hasLearnerSyncPending(uid);
      if (!cancelled) {
        setSyncPending(pending);
      }
    };

    // Interval (and any future external trigger) may call setState; initial poll
    // only sets state after await so it is not synchronous in the effect body.
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 8_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [uid, cloudEligible, isOnline]);

  const effectiveSyncPending = cloudEligible ? syncPending : false;

  let kind: ConnectivityKind = 'online';
  if (!isOnline) {
    kind = 'offline';
  } else if (authReady && isGuest) {
    kind = 'guest_local';
  } else if (authReady && effectiveSyncPending) {
    kind = 'sync_pending';
  }

  return {
    kind,
    isOnline,
    isGuest,
    syncPending: effectiveSyncPending,
    refresh: async () => {
      await refresh();
      if (!uid || !cloudEligible) {
        return;
      }
      setSyncPending(await hasLearnerSyncPending(uid));
    },
  };
}
