import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/features/profile/hooks/useProfile';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { useAuth } from '../hooks/useAuth';

export function VerifyEmailScreen() {
  const { colors } = useTheme();
  const { user, resendVerificationEmail, refreshUser, signOut, isLoading, error, clearError } =
    useAuth();
  const { upsertProfile } = useProfile();
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    clearError();
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch {
      // Error handled by auth context
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified && refreshedUser.email) {
        await upsertProfile({
          uid: refreshedUser.uid,
          email: refreshedUser.email,
          displayName: refreshedUser.displayName ?? 'Trader',
        });
        router.replace('/(tabs)');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-6">
        <View className="mt-8 flex-1">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-warning-muted">
            <Ionicons name="mail-unread-outline" size={32} color={colors.warning.primary} />
          </View>

          <Text variant="h1">Verify your email</Text>
          <Text variant="body" className="mt-3 text-text-secondary">
            We sent a verification link to{' '}
            <Text className="font-semibold text-text-primary">{user?.email ?? 'your email'}</Text>.
            Please verify to sync your decision workspace.
          </Text>

          {error ? (
            <View
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              className="mt-6 rounded-card bg-bearish-muted px-4 py-3"
            >
              <Text variant="body-sm" className="text-bearish">
                {error}
              </Text>
            </View>
          ) : null}

          {resent ? (
            <View
              accessibilityLiveRegion="polite"
              className="mt-6 rounded-card bg-bullish-muted px-4 py-3"
            >
              <Text variant="body-sm" className="text-bullish">
                Verification email resent successfully.
              </Text>
            </View>
          ) : null}

          <View className="mt-10 gap-3">
            <Button
              fullWidth
              size="lg"
              onPress={handleRefresh}
              disabled={checking}
              loading={checking}
            >
              I&apos;ve verified my email
            </Button>

            <Button
              fullWidth
              variant="secondary"
              onPress={handleResend}
              disabled={isLoading}
              loading={isLoading}
            >
              Resend email
            </Button>

            <Button fullWidth variant="ghost" onPress={handleSignOut}>
              Sign out
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
