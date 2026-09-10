export type AppCheckInitMode = 'debug' | 'recaptcha' | 'unattested';

/**
 * Production must never attach a debug CustomProvider.
 * Native DeviceCheck / Play Integrity belongs in a later EAS native wiring pass;
 * until then, skip client tokens so Functions fail closed instead of accepting
 * `expo-ios-debug` placeholders.
 */
export function resolveAppCheckInitMode(input: {
  isDev: boolean;
  platform: string;
  recaptchaSiteKey?: string;
}): AppCheckInitMode {
  if (input.isDev) return 'debug';
  if (input.platform === 'web' && input.recaptchaSiteKey?.trim()) return 'recaptcha';
  return 'unattested';
}
