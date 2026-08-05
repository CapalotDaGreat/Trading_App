import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

// Global-scope TaskManager.defineTask for OS-scheduled alert evaluation.
import '@/features/alerts/services/alert-background.task';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  initializePushNotifications,
  usePushNotificationHandler,
} from '@/features/notifications/services/push-handler';
import { reconcileOnboarding } from '@/features/onboarding/services/onboarding-reconciliation.service';
import { resolveRootRedirect } from '@/features/onboarding/services/onboarding-routing.service';
import type { OnboardingResolution } from '@/features/onboarding/types/onboarding.types';
import { useSessionTimeout } from '@/features/settings/hooks/useSessionTimeout';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { AppProviders } from '@/shared/providers/AppProviders';
import { useTheme } from '@/shared/hooks/useTheme';
import { trackScreenOpen } from '@/shared/services/analytics';
import {
  addBreadcrumb,
  captureException,
  setObservabilityRoute,
} from '@/shared/services/observability';
import { logger } from '@/shared/services/observability/logger';
import { performanceDiagnostics } from '@/shared/services/performance';
import { useSettingsStore } from '@/shared/stores/settings.store';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    captureException(error, { boundary: 'expo-router' });
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text variant="h3" className="mb-2 text-center">
        Something went wrong
      </Text>
      <Text variant="body-sm" className="mb-2 text-center text-text-secondary">
        Why: an unexpected render error interrupted this screen.
      </Text>
      <Text variant="body-sm" className="mb-6 text-center text-text-secondary">
        Recover: try again. This is not sent off-device unless crash reporting is enabled in Privacy.
      </Text>
      <Button onPress={retry} accessibilityHint="Retries the last failed screen">
        Try Again
      </Button>
    </View>
  );
}

export const unstable_settings = {
  initialRouteName: isFirebaseConfigured() ? '(auth)/welcome' : '(tabs)',
};

SplashScreen.preventAutoHideAsync();
performanceDiagnostics.mark('startup.begin');

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      performanceDiagnostics.mark('startup.ready');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppProviders>
      <RootLayoutNav />
    </AppProviders>
  );
}

function RootLayoutNav() {
  const { status, user } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const localOnboardingCompleted = useSettingsStore((state) => state.hasCompletedOnboarding);
  const [onboarding, setOnboarding] = useState<OnboardingResolution | null>(null);

  usePushNotificationHandler();
  useSessionTimeout();

  useEffect(() => {
    const route = `/${segments.join('/')}`;
    setObservabilityRoute(route);
    addBreadcrumb('navigation.route_changed', { route });
    trackScreenOpen(route);
  }, [segments]);

  useEffect(() => {
    let cancelled = false;
    if (status !== 'authenticated' || !user?.uid) {
      setOnboarding(null);
      return () => {
        cancelled = true;
      };
    }
    setOnboarding(null);
    void Promise.resolve(useSettingsStore.persist.rehydrate())
      .then(async () => {
        const resolution = await reconcileOnboarding(user.uid);
        if (!cancelled) setOnboarding(resolution);
      })
      .catch((error) => {
        if (cancelled) return;
        logger.warn('onboarding.reconciliation_fallback', { error });
        const completed = useSettingsStore.getState().hasCompletedOnboarding;
        setOnboarding({
          completed,
          experience: user.uid === DEMO_USER_UID ? 'demo_guide' : 'full',
          reason: completed
            ? 'explicit_completion'
            : user.uid === DEMO_USER_UID
              ? 'demo_guide'
              : 'new_user',
          shouldPersistCompletion: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [status, user?.uid, localOnboardingCompleted]);

  const mentorSetupCompleted = useSettingsStore((state) => state.mentorSetupCompleted);

  useEffect(() => {
    const destination = resolveRootRedirect({
      status,
      firebaseConfigured: isFirebaseConfigured(),
      firstSegment: segments[0],
      secondSegment: segments[1],
      onboarding,
      mentorSetupCompleted,
    });
    if (destination) router.replace(destination as never);
  }, [status, segments, onboarding, mentorSetupCompleted, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.uid && user.uid !== DEMO_USER_UID) {
      void initializePushNotifications(user.uid).catch((error) => {
        logger.error('push.initialization_failed', error);
      });
    }
  }, [status, user?.uid]);

  if (status === 'authenticated' && !onboarding) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text variant="body-sm" className="mt-4 text-center">
          Preparing your decision workspace…
        </Text>
      </View>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="decision" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="academy" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="asset/[symbol]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }

  if (status === 'loading') {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text variant="body-sm" className="mt-4 text-center">
          Signing you in…
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="decision" />
      <Stack.Screen name="analysis" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="academy" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="asset/[symbol]" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
