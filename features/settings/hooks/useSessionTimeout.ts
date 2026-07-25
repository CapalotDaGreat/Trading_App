import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';

/**
 * Optional idle session timeout. Skips demo guest. Signs out after configured idle minutes.
 */
export function useSessionTimeout() {
  const { user, signOut, status } = useAuth();
  const sessionTimeoutMinutes = useSettingsStore((s) => s.sessionTimeoutMinutes);
  const lastActiveRef = useRef(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    lastActiveRef.current = Date.now();
  }, [user?.uid, sessionTimeoutMinutes]);

  useEffect(() => {
    if (!user || user.uid === DEMO_USER_UID || status !== 'authenticated') return;
    if (!sessionTimeoutMinutes) return;

    const timeoutMs = sessionTimeoutMinutes * 60_000;

    const onChange = (next: AppStateStatus) => {
      const previous = appStateRef.current;
      appStateRef.current = next;

      if (previous.match(/inactive|background/) && next === 'active') {
        if (Date.now() - lastActiveRef.current >= timeoutMs) {
          void signOut();
          return;
        }
      }

      if (next === 'active') {
        lastActiveRef.current = Date.now();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    const tick = setInterval(() => {
      if (appStateRef.current !== 'active') return;
      if (Date.now() - lastActiveRef.current >= timeoutMs) {
        void signOut();
      } else {
        lastActiveRef.current = Date.now();
      }
    }, 60_000);

    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, [user, status, sessionTimeoutMinutes, signOut]);
}
