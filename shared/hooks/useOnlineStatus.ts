import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

/**
 * Lightweight connectivity probe — avoids a hard NetInfo native dependency.
 * Treats consecutive probe failures as offline; resumes on AppState active.
 */
async function probeOnline(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    // Tiny public endpoint; failure means we treat the device as offline for UX.
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const online = await probeOnline();
      if (!mounted) return;
      setIsOnline(online);
      setCheckedAt(Date.now());
    };

    void refresh();
    const interval = setInterval(() => void refresh(), 30_000);

    const onAppState = (status: AppStateStatus) => {
      if (status === 'active') void refresh();
    };
    const sub = AppState.addEventListener('change', onAppState);

    const onWebOnline = () => {
      if (Platform.OS === 'web') {
        setIsOnline(true);
        setCheckedAt(Date.now());
      }
    };
    const onWebOffline = () => {
      if (Platform.OS === 'web') {
        setIsOnline(false);
        setCheckedAt(Date.now());
      }
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('online', onWebOnline);
      window.addEventListener('offline', onWebOffline);
    }

    return () => {
      mounted = false;
      clearInterval(interval);
      sub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('online', onWebOnline);
        window.removeEventListener('offline', onWebOffline);
      }
    };
  }, []);

  return { isOnline, checkedAt, refresh: probeOnline };
}
