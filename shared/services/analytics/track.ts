import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

import { callProxy, canUseVendorProxy } from '@/shared/services/firebase/callable-proxy';
import { logger } from '@/shared/services/observability/logger';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  ANALYTICS_EVENTS,
  ANALYTICS_PROP_KEYS,
  type AnalyticsEventName,
  type AnalyticsProps,
} from './events';

const INSTALL_ID_KEY = 'tradevision-install-id-v1';
const eventSet = new Set<string>(ANALYTICS_EVENTS);
const propSet = new Set<string>(ANALYTICS_PROP_KEYS);

let installIdPromise: Promise<string | null> | null = null;

async function getInstallId(): Promise<string | null> {
  if (!installIdPromise) {
    installIdPromise = (async () => {
      try {
        const existing = await SecureStore.getItemAsync(INSTALL_ID_KEY);
        if (existing) return existing;
        const created = `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        await SecureStore.setItemAsync(INSTALL_ID_KEY, created);
        return created;
      } catch {
        return null;
      }
    })();
  }
  return installIdPromise;
}

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps {
  if (!props) return {};
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!propSet.has(key)) continue;
    if (typeof value === 'string') out[key as keyof AnalyticsProps] = value.slice(0, 64);
    else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key as keyof AnalyticsProps] = value;
    } else if (typeof value === 'boolean') out[key as keyof AnalyticsProps] = value;
  }
  return out;
}

/**
 * Privacy-first product analytics. No-ops unless user opted in.
 * Never accepts free-form text fields (journal/AI/portfolio).
 */
export async function trackEvent(
  name: AnalyticsEventName,
  props?: AnalyticsProps,
): Promise<void> {
  if (!eventSet.has(name)) return;

  const settings = useSettingsStore.getState();
  if (!settings.productAnalyticsEnabled) return;

  if (!canUseVendorProxy()) {
    // Guest/demo: keep local-only; do not invent cloud analytics.
    if (__DEV__) {
      logger.info('analytics.local_only', { name });
    }
    return;
  }

  const sampleRate = 1; // remote sample applied server-side / future bootstrap
  if (Math.random() > sampleRate) return;

  const tier = useSubscriptionStore.getState().tier;
  const payload = {
    consent: true as const,
    name,
    props: {
      ...sanitizeProps(props),
      tier,
      platform: Platform.OS,
      channel: Updates.channel ?? 'unknown',
    },
    installId: await getInstallId(),
  };

  try {
    await callProxy('trackProductEvent', payload);
  } catch (error) {
    logger.warn('analytics.track_failed', { name, error });
  }
}

export function trackScreenOpen(screen: string): void {
  void trackEvent('screen_open', { screen: screen.slice(0, 64) });
}

export function trackFeatureUse(feature: string): void {
  void trackEvent('feature_use', { feature: feature.slice(0, 64) });
}
