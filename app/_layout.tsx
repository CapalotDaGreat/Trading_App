import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { initializePushNotifications, usePushNotificationHandler } from '@/features/notifications/services/push-handler';
import { isFirebaseConfigured } from '@/firebase/config';
import { AppProviders } from '@/shared/providers/AppProviders';

export {
  ErrorBoundary,
} from 'expo-router';

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

  usePushNotificationHandler();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'mfa_required' && segments[0] !== '(auth)') {
      router.replace('/(auth)/mfa');
      return;
    }

    const isAuthenticated =
      status === 'authenticated' ||
      (status === 'email_verification_required' && user !== null);

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      if (status === 'email_verification_required') {
        router.replace('/(auth)/verify-email');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [status, user, segments, router]);

  useEffect(() => {
    if (status === 'authenticated' && user?.uid) {
      void initializePushNotifications(user.uid);
    }
  }, [status, user?.uid]);

  if (!isFirebaseConfigured()) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
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
      <Stack.Screen name="(tabs)" />
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
