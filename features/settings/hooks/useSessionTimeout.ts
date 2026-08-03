import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';

let lastInteractionMs = Date.now();

/** Call on user interaction (root touch capture) to reset idle clock. */
export function markSessionActive(): void {
  lastInteractionMs = Date.now();
}

/**
 * Optional idle session timeout. Skips demo guest.
 * Uses true idle time: last interaction (or resume) vs configured minutes.
 */
export function useSessionTimeout() {
  const { user, signOut, status } = useAuth();
  const sessionTimeoutMinutes = useSettingsStore((s) => s.sessionTimeoutMinutes);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    markSessionActive();
  }, [user?.uid, sessionTimeoutMinutes]);

  useEffect(() => {
    if (!user || user.uid === DEMO_USER_UID || status !== 'authenticated') return;
    if (!sessionTimeoutMinutes) return;

    const timeoutMs = sessionTimeoutMinutes * 60_000;

    const onChange = (next: AppStateStatus) => {
      const previous = appStateRef.current;
      appStateRef.current = next;

      if (previous.match(/inactive|background/) && next === 'active') {
        if (Date.now() - lastInteractionMs >= timeoutMs) {
          void signOut();
          return;
        }
        markSessionActive();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    const tick = setInterval(() => {
      if (Date.now() - lastInteractionMs >= timeoutMs) {
        void signOut();
      }
    }, 30_000);

    return () => {
      sub.remove();
      clearInterval(tick);
    };
  }, [user, status, sessionTimeoutMinutes, signOut]);
}
