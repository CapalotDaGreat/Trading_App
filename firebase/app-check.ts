import { initializeAppCheck, CustomProvider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { Platform } from 'react-native';

import { logger } from '@/shared/services/observability/logger';

let appCheck: AppCheck | null = null;

/**
 * Initialize Firebase App Check.
 * - __DEV__ / Expo Go: debug token (register printed token in Firebase Console).
 * - Production native: CustomProvider placeholder until DeviceCheck/Play Integrity
 *   native module is attached in EAS builds; Functions use soft requireAppCheck.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheck) return appCheck;

  try {
    if (__DEV__) {
      const debugToken = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN;
      // Setting true causes the SDK to log a debug token to register in Console.
      (
        globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
      ).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken && debugToken.length > 0 ? debugToken : true;
    }

    const provider = new CustomProvider({
      getToken: async () => {
        const debug = (
          globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
        ).FIREBASE_APPCHECK_DEBUG_TOKEN;
        const token =
          typeof debug === 'string' && debug.length > 0
            ? debug
            : process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN || `expo-${Platform.OS}-debug`;
        return {
          token,
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        };
      },
    });

    appCheck = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
    logger.info('app_check.initialized', { platform: Platform.OS, dev: __DEV__ });
    return appCheck;
  } catch (error) {
    logger.warn('app_check.init_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

export function getAppCheck(): AppCheck | null {
  return appCheck;
}
