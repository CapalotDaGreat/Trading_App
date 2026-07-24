import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { useAuth } from '../hooks/useAuth';

export function WelcomeScreen() {
  const { signInAnonymously, isLoading } = useAuth();
  const { colors } = useTheme();
  const [acceptedGuestTerms, setAcceptedGuestTerms] = useState(false);

  const handleGuestAccess = async () => {
    if (!acceptedGuestTerms) return;
    await signInAnonymously();
    router.replace('/(tabs)');
  };

  return (
    <Screen
      scrollable
      className="bg-background"
      scrollViewProps={{ contentContainerStyle: { flexGrow: 1 } }}
    >
      <View className="min-h-full flex-1 py-6">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-accent-muted">
            <Ionicons name="compass-outline" size={24} color={colors.accent.primary} />
          </View>
          <View>
            <Text variant="h3">TradeVision AI</Text>
            <Text variant="caption" className="text-text-secondary">
              Decision-first market research
            </Text>
          </View>
        </View>

        <View className="flex-1 justify-center py-10">
          <Text variant="h1" className="text-4xl leading-tight">
            Spend your attention{'\n'}
            <Text className="text-accent">where it matters</Text>
          </Text>
          <Text variant="body" className="mt-4 max-w-xl text-text-secondary">
            Start with a focused brief, decide what deserves research, then review the quality of
            your process. No buy/sell signals and no prediction claims.
          </Text>

          <GlassCard className="mt-8" bordered>
            <View className="p-5">
              <View className="mb-4 flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent.primary} />
                <Text variant="body-sm" className="ml-3 flex-1">
                  Optional MFA and privacy-first crash reporting on signed-in accounts
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cloud-offline-outline" size={20} color={colors.text.secondary} />
                <Text variant="body-sm" className="ml-3 flex-1">
                  Local demo available; cloud sync after you create an account
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        <View>
          <Button
            fullWidth
            size="lg"
            onPress={() => router.push('/(auth)/register')}
            accessibilityLabel="Create account"
          >
            Create account
          </Button>

          <Button
            fullWidth
            variant="secondary"
            className="mt-3"
            onPress={() => router.push('/(auth)/login')}
          >
            Sign in
          </Button>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedGuestTerms }}
            accessibilityLabel="Confirm age 18 or older and acknowledge guest risk disclaimer"
            testID="welcome-guest-age-ack"
            onPress={() => setAcceptedGuestTerms((value) => !value)}
            className="mt-4 min-h-11 flex-row items-start py-1"
          >
            <Ionicons
              name={acceptedGuestTerms ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedGuestTerms ? colors.accent.primary : colors.text.tertiary}
              style={{ marginTop: 2, marginRight: 10 }}
            />
            <Text variant="caption" className="flex-1 text-text-secondary">
              I am 18+ and understand Guest mode is a local demo. Scores do not predict prices.
              TradeVision does not provide investment advice or buy/sell signals.
            </Text>
          </Pressable>

          <Button
            fullWidth
            variant="ghost"
            className="mt-1"
            onPress={handleGuestAccess}
            disabled={isLoading || !acceptedGuestTerms}
            accessibilityLabel="Continue as Guest"
            testID="welcome-continue-guest"
            loading={isLoading}
          >
            Continue as guest
          </Button>
        </View>
      </View>
    </Screen>
  );
}
