import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';

import { redact, redactContext } from './redaction';
import type { ObservabilityProvider } from './types';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

function releaseName(): string {
  const appId = Application.applicationId ?? 'tradevision';
  const version =
    Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'unknown';
  return `${appId}@${version}`;
}

export const sentryObservabilityProvider: ObservabilityProvider = {
  name: 'sentry',

  async initialize() {
    if (!dsn) return false;

    const tracesSampleRate = Math.min(
      0.2,
      Math.max(0, Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05)),
    );

    Sentry.init({
      dsn,
      enabled: true,
      sendDefaultPii: false,
      tracesSampleRate,
      enableAutoSessionTracking: true,
      release: releaseName(),
      dist: Application.nativeBuildVersion ?? undefined,
      beforeSend: (event) => redact(event) as typeof event,
      beforeBreadcrumb: (breadcrumb) => redact(breadcrumb) as typeof breadcrumb,
    });

    Sentry.setTag('channel', Updates.channel ?? 'unknown');
    Sentry.setTag('platform', Constants.platform?.ios ? 'ios' : Constants.platform?.android ? 'android' : 'unknown');
    Sentry.setContext('release', {
      applicationId: Application.applicationId,
      version: Application.nativeApplicationVersion,
      build: Application.nativeBuildVersion,
      updateId: Updates.updateId,
      embeddedUpdate: Updates.isEmbeddedLaunch,
      channel: Updates.channel ?? 'unknown',
    });
    Sentry.setContext('device', {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      model: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
      physical: Device.isDevice,
    });
    return true;
  },

  captureException(error, context) {
    Sentry.captureException(error, {
      extra: redactContext(context),
    });
  },

  addBreadcrumb(message, context, level = 'info') {
    Sentry.addBreadcrumb({
      message,
      data: redactContext(context),
      level,
    });
  },

  setUser(uid) {
    Sentry.setUser(uid ? { id: uid } : null);
  },

  setRoute(route) {
    Sentry.setTag('route', route);
  },

  async disable() {
    Sentry.setUser(null);
    Sentry.getGlobalScope().clear();
    await Sentry.getClient()?.close(0);
  },
};
