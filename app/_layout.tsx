import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  initializePushNotifications,
  usePushNotificationHandler,
} from '@/features/notifications/services/push-handler';
import { reconcileOnboarding } from '@/features/onboarding/services/onboarding-reconciliation.service';
import { resolveRootRedirect } from '@/features/onboarding/services/onboarding-routing.service';
import type { OnboardingResolution } from '@/features/onboarding/types/onboarding.types';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';
import { AppProviders } from '@/shared/providers/AppProviders';
import { useSettingsStore } from '@/shared/stores/settings.store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: isFirebaseConfigured() ? '(auth)/welcome' : '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
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
  const segments = useSegments();
  const router = useRouter();
  const localOnboardingCompleted = useSettingsStore((state) => state.hasCompletedOnboarding);
  const [onboarding, setOnboarding] = useState<OnboardingResolution | null>(null);

  usePushNotificationHandler();

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
      .catch(() => {
        if (cancelled) return;
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

  useEffect(() => {
    const destination = resolveRootRedirect({
      status,
      firebaseConfigured: isFirebaseConfigured(),
      firstSegment: segments[0],
      secondSegment: segments[1],
      onboarding,
    });
    if (destination) router.replace(destination as never);
  }, [status, segments, onboarding, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.uid) {
      void initializePushNotifications(user.uid);
    }
  }, [status, user?.uid]);

  if (status === 'authenticated' && !onboarding) {
    return null;
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
    return null;
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
