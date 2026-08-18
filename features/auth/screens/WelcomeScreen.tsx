import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { fadeInDown } from '@/shared/utils/motion';

import { useAuth } from '../hooks/useAuth';

const PRINCIPLES = [
  {
    icon: 'compass-outline' as const,
    title: 'Decision-first',
    body: 'Ask “should I research this?” — never chase buy/sell signals.',
  },
  {
    icon: 'school-outline' as const,
    title: 'Educational Mode',
    body: 'Scores measure process quality (DQS / RVS), not price prediction.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Privacy by default',
    body: 'Guest mode stays local. Crash reporting is opt-in. No brokerage access.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Honest AI limits',
    body: 'AI coaches your process and cites evidence. It does not guarantee outcomes.',
  },
];

export function WelcomeScreen() {
  const { signInAnonymously, isLoading } = useAuth();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [acceptedGuestTerms, setAcceptedGuestTerms] = useState(false);

  const handleGuestAccess = async () => {
    if (!acceptedGuestTerms) return;
    await signInAnonymously();
    router.replace('/(tabs)');
  };

  return (
    <Screen
      scrollable
      accessibilityTitle="Welcome to TradeInsight"
      className="bg-background"
      scrollViewProps={{ contentContainerStyle: { flexGrow: 1 } }}
    >
      <View className="min-h-full flex-1 py-6">
        <View className="flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-accent-muted">
            <Ionicons name="compass-outline" size={24} color={colors.accent.primary} />
          </View>
          <View>
            <Text variant="h3" accessibilityRole="header">
              TradeInsight
            </Text>
            <Text variant="caption" className="text-text-secondary">
              TradeInsight by Aithera · Research smarter. Decide with clarity.
            </Text>
          </View>
        </View>

        <Animated.View entering={fadeInDown(reduceMotion)} className="flex-1 justify-center py-10">
          <Text variant="h1" className="text-4xl leading-tight" accessibilityRole="header">
            Spend your attention{'\n'}
            <Text className="text-accent">where it matters</Text>
          </Text>
          <Text variant="body" className="mt-4 max-w-xl text-text-secondary">
            A decision-first research and coaching app. Learn the workflow: brief → research or skip
            → journal. Anyone can try Guest mode. Accounts and purchases require age of majority.
          </Text>

          <GlassCard className="mt-8" bordered>
            <View className="gap-4 p-5">
              {PRINCIPLES.map((item) => (
                <View key={item.title} className="flex-row items-start">
                  <Ionicons name={item.icon} size={20} color={colors.accent.primary} />
                  <View className="ml-3 flex-1">
                    <Text variant="label" className="text-text-primary">
                      {item.title}
                    </Text>
                    <Text variant="caption" className="mt-0.5 text-text-secondary">
                      {item.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <View>
          <Button
            fullWidth
            size="lg"
            onPress={() => router.push('/(auth)/register')}
            accessibilityLabel="Create account"
            accessibilityHint="Starts account registration for cloud sync"
          >
            Create account
          </Button>

          <Button
            fullWidth
            variant="secondary"
            className="mt-3"
            onPress={() => router.push('/(auth)/login')}
            accessibilityLabel="Sign in"
          >
            Sign in
          </Button>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedGuestTerms }}
            accessibilityLabel="Acknowledge Guest mode is a local educational demo, not investment advice"
            accessibilityHint="Required before continuing as guest"
            testID="welcome-guest-risk-ack"
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
              I understand Guest mode is a local educational demo. Scores do not predict prices.
              TradeInsight does not provide investment advice or buy/sell signals.
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
