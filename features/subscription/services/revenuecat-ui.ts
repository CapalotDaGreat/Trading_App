import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { default as RevenueCatUI } from 'react-native-purchases-ui';

type PaywallView = (typeof RevenueCatUI)['Paywall'];

let cachedPaywall: PaywallView | null | undefined;

/**
 * Lazily load the embedded RevenueCat Paywall view. Never import the native
 * module at the top of a screen — Expo Go / web do not ship it.
 */
export function loadRevenueCatPaywallView(): PaywallView | null {
  if (cachedPaywall !== undefined) return cachedPaywall;
  if (
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    cachedPaywall = null;
    return null;
  }

  try {
    const mod = require('react-native-purchases-ui') as { default?: { Paywall?: PaywallView } };
    cachedPaywall = (mod.default?.Paywall as PaywallView | undefined) ?? null;
  } catch {
    cachedPaywall = null;
  }
  return cachedPaywall;
}

export function isRevenueCatPaywallViewAvailable(): boolean {
  return Boolean(loadRevenueCatPaywallView());
}
