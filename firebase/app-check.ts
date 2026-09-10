import { initializeAppCheck, CustomProvider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { Platform } from 'react-native';

import { logger } from '@/shared/services/observability/logger';
import { resolveAppCheckInitMode } from '@/firebase/app-check-mode';

export type { AppCheckInitMode } from '@/firebase/app-check-mode';
export { resolveAppCheckInitMode } from '@/firebase/app-check-mode';

let appCheck: AppCheck | null = null;

function debugTokenValue(): string | boolean {
  const configured = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN?.trim();
  return configured && configured.length > 0 ? configured : true;
}

/**
 * Initialize Firebase App Check.
 * - __DEV__ / Expo Go: debug token (register the printed token in Firebase Console).
 * - Production web: ReCaptcha v3 when `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` is set.
 * - Production native: no fake token. Cloud Functions reject missing App Check
 *   unless APP_CHECK_SOFT=true (staging only — never production).
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheck) return appCheck;

  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  const mode = resolveAppCheckInitMode({
    isDev,
    platform: Platform.OS,
    recaptchaSiteKey,
  });

  try {
    if (mode === 'debug') {
      (
        globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
      ).FIREBASE_APPCHECK_DEBUG_TOKEN = debugTokenValue();

      const provider = new CustomProvider({
        getToken: async () => {
          const debug = (
            globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
          ).FIREBASE_APPCHECK_DEBUG_TOKEN;
          const token =
            typeof debug === 'string' && debug.length > 0
              ? debug
              : process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN?.trim() || `expo-${Platform.OS}-debug`;
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
      logger.info('app_check.initialized', { platform: Platform.OS, mode: 'debug' });
      return appCheck;
    }

    if (mode === 'recaptcha') {
      const { ReCaptchaV3Provider } = require('firebase/app-check') as {
        ReCaptchaV3Provider: new (siteKey: string) => CustomProvider;
      };
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey!),
        isTokenAutoRefreshEnabled: true,
      });
      logger.info('app_check.initialized', { platform: 'web', mode: 'recaptcha' });
      return appCheck;
    }

    logger.warn('app_check.production_unattested', {
      platform: Platform.OS,
      note: 'No debug token attached. Functions fail closed until native attestation is wired.',
    });
    return null;
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

/** Test helper. */
export function resetAppCheckForTests(): void {
  appCheck = null;
}
