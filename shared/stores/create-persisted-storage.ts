import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Expo Router web uses Node SSR (`output: 'static'`). AsyncStorage's web
 * implementation touches `window`, which crashes Metro if we persist during SSR.
 * Use an in-memory noop on the server; AsyncStorage everywhere else (including Expo Go).
 */
function createMemoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

function isWebServer(): boolean {
  return Platform.OS === 'web' && typeof window === 'undefined';
}

export function createPersistedStorage() {
  return createJSONStorage(() => (isWebServer() ? createMemoryStorage() : AsyncStorage));
}

/**
 * Coalesce rapid Zustand persist writes (clock ticks, evidence ingest).
 * `setItem` is fire-and-forget after the delay so callers are not blocked.
 * Tests / Metro keep delay 0 via `__DEV__` unless an explicit delay is passed.
 */
function createDebouncedAdapter(base: StateStorage, delayMs: number): StateStorage {
  if (delayMs <= 0) return base;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const pending = new Map<string, string>();
  return {
    getItem: (name) => {
      const queued = pending.get(name);
      if (queued != null) return queued;
      return base.getItem(name);
    },
    setItem: (name, value) => {
      pending.set(name, value);
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.set(
        name,
        setTimeout(() => {
          timers.delete(name);
          const next = pending.get(name);
          pending.delete(name);
          if (next != null) void Promise.resolve(base.setItem(name, next));
        }, delayMs),
      );
    },
    removeItem: (name) => {
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.delete(name);
      pending.delete(name);
      return base.removeItem(name);
    },
  };
}

export function createDebouncedPersistedStorage(delayMs = __DEV__ ? 0 : 400) {
  return createJSONStorage(() => {
    const base = isWebServer() ? createMemoryStorage() : AsyncStorage;
    return createDebouncedAdapter(base, delayMs);
  });
}
