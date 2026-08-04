import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAlertEvaluator } from '@/features/alerts/hooks/useAlertEvaluator';
import { AuthProvider, useAuth } from '@/features/auth/hooks/useAuth';
import { useOpsConfigBootstrap } from '@/features/ops-config/hooks/useOpsConfig';
import { BiometricGate } from '@/features/settings/components/BiometricGate';
import { markSessionActive } from '@/features/settings/hooks/useSessionTimeout';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { ToastProvider } from '@/shared/components/feedback/Toast';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { trackEvent } from '@/shared/services/analytics';
import { configureObservability, setObservabilityUser } from '@/shared/services/observability';
import { logger } from '@/shared/services/observability/logger';
import { configurePerformanceAnalytics } from '@/shared/services/performance';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useOpsConfigStore } from '@/features/ops-config/stores/ops-config.store';

interface AppProvidersProps {
  children: React.ReactNode;
}

function SubscriptionBootstrap({ children }: AppProvidersProps) {
  const { refresh, uid } = useSubscription();

  useEffect(() => {
    if (uid) {
      void refresh();
    }
  }, [uid, refresh]);

  return children;
}

function AlertEvaluationBootstrap({ children }: AppProvidersProps) {
  useAlertEvaluator();
  return children;
}

function ObservabilityBootstrap({ children }: AppProvidersProps) {
  const { user } = useAuth();
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const enabled = useSettingsStore((state) => state.crashReportingEnabled);
  const analyticsEnabled = useSettingsStore((state) => state.productAnalyticsEnabled);

  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    void configureObservability(enabled)
      .then(() => {
        if (!cancelled) setObservabilityUser(enabled ? (user?.uid ?? null) : null);
      })
      .catch((error) => logger.warn('observability.lifecycle_failed', { error }));
    return () => {
      cancelled = true;
    };
  }, [enabled, hasHydrated, user?.uid]);

  useEffect(() => {
    if (!hasHydrated || !analyticsEnabled) return;
    void trackEvent('app_launch');
  }, [hasHydrated, analyticsEnabled]);

  useEffect(() => {
    if (!hasHydrated) return;
    const sampleRate = useOpsConfigStore.getState().snapshot.remote.perfSampleRate;
    configurePerformanceAnalytics(
      analyticsEnabled
        ? (name, props) => {
            void trackEvent(name, props);
          }
        : null,
      sampleRate,
    );
  }, [hasHydrated, analyticsEnabled]);

  return children;
}

function OpsConfigBootstrap({ children }: AppProvidersProps) {
  useOpsConfigBootstrap();
  return children;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ObservabilityBootstrap>
                <OpsConfigBootstrap>
                  <ToastProvider>
                    <SubscriptionBootstrap>
                      <AlertEvaluationBootstrap>
                        <BiometricGate>
                          <View className="flex-1" onTouchStart={markSessionActive}>
                            {children}
                          </View>
                        </BiometricGate>
                      </AlertEvaluationBootstrap>
                    </SubscriptionBootstrap>
                  </ToastProvider>
                </OpsConfigBootstrap>
              </ObservabilityBootstrap>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
