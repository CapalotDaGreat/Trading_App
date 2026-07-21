import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { noopObservabilityProvider } from './noop.provider';
import { sentryObservabilityProvider } from './sentry.provider';
import type { ObservabilityContext, ObservabilityLevel, ObservabilityProvider } from './types';

let activeProvider: ObservabilityProvider = noopObservabilityProvider;
let transition = Promise.resolve();

export function isObservabilityRuntimeSupported(): boolean {
  return (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN?.trim())
  );
}

export function configureObservability(enabled: boolean): Promise<void> {
  transition = transition.then(async () => {
    if (!enabled || !isObservabilityRuntimeSupported()) {
      const previousProvider = activeProvider;
      activeProvider = noopObservabilityProvider;
      if (previousProvider.name !== 'noop') await previousProvider.disable();
      return;
    }
    if (activeProvider.name === 'sentry') return;
    if (await sentryObservabilityProvider.initialize()) {
      activeProvider = sentryObservabilityProvider;
    }
  });
  return transition;
}

export function captureException(error: unknown, context?: ObservabilityContext): void {
  activeProvider.captureException(error, context);
}

export function addBreadcrumb(
  message: string,
  context?: ObservabilityContext,
  level?: ObservabilityLevel,
): void {
  activeProvider.addBreadcrumb(message, context, level);
}

export function setObservabilityUser(uid: string | null): void {
  activeProvider.setUser(uid);
}

export function setObservabilityRoute(route: string): void {
  activeProvider.setRoute(route);
}

export function getObservabilityProviderName(): ObservabilityProvider['name'] {
  return activeProvider.name;
}

export { redact, redactContext } from './redaction';
export type { ObservabilityContext, ObservabilityLevel, ObservabilityProvider } from './types';
