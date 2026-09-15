import { useCallback, useEffect, useState } from 'react';

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

  const refreshSync = useCallback(async () => {
    if (!uid || !cloudEligible) {
      setSyncPending(false);
      return;
    }
    setSyncPending(await hasLearnerSyncPending(uid));
  }, [uid, cloudEligible]);

  useEffect(() => {
    void refreshSync();
    const timer = setInterval(() => {
      void refreshSync();
    }, 8_000);
    return () => clearInterval(timer);
  }, [refreshSync, isOnline]);

  let kind: ConnectivityKind = 'online';
  if (!isOnline) {
    kind = 'offline';
  } else if (authReady && isGuest) {
    kind = 'guest_local';
  } else if (authReady && syncPending) {
    kind = 'sync_pending';
  }

  return {
    kind,
    isOnline,
    isGuest,
    syncPending,
    refresh: async () => {
      await refresh();
      await refreshSync();
    },
  };
}
