import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { useAlertEvaluator } from '@/features/alerts/hooks/useAlertEvaluator';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { ToastProvider } from '@/shared/components/feedback/Toast';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';

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

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <SubscriptionBootstrap>
                  <AlertEvaluationBootstrap>{children}</AlertEvaluationBootstrap>
                </SubscriptionBootstrap>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
