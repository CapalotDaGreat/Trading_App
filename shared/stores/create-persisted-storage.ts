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
