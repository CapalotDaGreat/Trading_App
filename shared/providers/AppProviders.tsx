import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAlertEvaluator } from '@/features/alerts/hooks/useAlertEvaluator';
import { AuthProvider, useAuth } from '@/features/auth/hooks/useAuth';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { ToastProvider } from '@/shared/components/feedback/Toast';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { configureObservability, setObservabilityUser } from '@/shared/services/observability';
import { logger } from '@/shared/services/observability/logger';
import { useSettingsStore } from '@/shared/stores/settings.store';

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
                <ToastProvider>
                  <SubscriptionBootstrap>
                    <AlertEvaluationBootstrap>{children}</AlertEvaluationBootstrap>
                  </SubscriptionBootstrap>
                </ToastProvider>
              </ObservabilityBootstrap>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
