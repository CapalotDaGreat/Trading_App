import { initializeAppCheck, CustomProvider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { Platform } from 'react-native';

import { logger } from '@/shared/services/observability/logger';
import { resolveAppCheckInitMode } from '@/firebase/app-check-mode';

export type { AppCheckInitMode } from '@/firebase/app-check-mode';
export { resolveAppCheckInitMode } from '@/firebase/app-check-mode';

let appCheck: AppCheck | null = null;

/**
 * Always return a concrete string. Firebase treats `true` as “generate a UUID”,
 * which calls bare `crypto.randomUUID()` — missing on RN Hermes without a polyfill.
 */
function debugTokenValue(): string {
  const configured = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN?.trim();
  if (configured && configured.length > 0) return configured;
  return `expo-${Platform.OS}-debug`;
}

function isServerRenderContext(): boolean {
  return Platform.OS === 'web' && typeof window === 'undefined';
}

/**
 * Initialize Firebase App Check.
 * - __DEV__ / Expo Go: CustomProvider debug token (register in Firebase Console if testing callables).
 * - Production web: ReCaptcha v3 when `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` is set.
 * - Production native: no fake token. Cloud Functions reject missing App Check
 *   unless APP_CHECK_SOFT=true (staging only — never production).
 *
 * Do not set `FIREBASE_APPCHECK_DEBUG_TOKEN = true`. That enables Firebase's
 * built-in debug path (`crypto.randomUUID` + IndexedDB), which is hostile to
 * Hermes and to Expo Router web SSR.
 */
export function initializeFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheck) return appCheck;
  if (isServerRenderContext()) {
    logger.info('app_check.skipped_ssr', { platform: Platform.OS });
    return null;
  }

  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  const mode = resolveAppCheckInitMode({
    isDev,
    platform: Platform.OS,
    recaptchaSiteKey,
  });

  try {
    if (mode === 'debug') {
      const token = debugTokenValue();
      // Clear any leftover `true` debug flag from hot reload / prior builds.
      for (const g of [globalThis, typeof global !== 'undefined' ? global : null]) {
        if (!g) continue;
        try {
          delete (g as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN;
        } catch {
          (g as { FIREBASE_APPCHECK_DEBUG_TOKEN?: unknown }).FIREBASE_APPCHECK_DEBUG_TOKEN = undefined;
        }
      }
      const provider = new CustomProvider({
        getToken: async () => ({
          token,
          expireTimeMillis: Date.now() + 60 * 60 * 1000,
        }),
      });

      appCheck = initializeAppCheck(app, {
        provider,
        // Avoid background IndexedDB/debug exchange noise on Expo Go / Hermes.
        isTokenAutoRefreshEnabled: false,
      });
      logger.info('app_check.initialized', {
        platform: Platform.OS,
        mode: 'debug',
        tokenSource: process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN?.trim() ? 'env' : 'platform_fallback',
      });
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
