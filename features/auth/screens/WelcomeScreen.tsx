import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { fadeInDown } from '@/shared/utils/motion';

import { useAuth } from '../hooks/useAuth';

const PRINCIPLES = [
  {
    icon: 'school-outline' as const,
    title: 'Learn the concepts',
    body: 'Academy paths teach usable skills — charts, risk, psychology — not get-rich slogans.',
  },
  {
    icon: 'fitness-outline' as const,
    title: 'Practice the decision',
    body: 'Short drills and replay rooms train judgment. A simulated profit is not automatically a good decision.',
  },
  {
    icon: 'play-circle-outline' as const,
    title: 'Simulated money only',
    body: 'Paper trading with labelled synthetic prices. No brokerage. No live execution.',
  },
  {
    icon: 'film-outline' as const,
    title: 'Review and improve',
    body: 'Journal reasoning. Simulated profit is not automatically a good decision.',
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
      accessibilityTitle={`Welcome to ${BRAND.product}`}
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
              {BRAND.product}
            </Text>
            <Text variant="caption" className="text-text-secondary">
              {BRAND.attribution} · {BRAND.loop}
            </Text>
          </View>
        </View>

        <Animated.View entering={fadeInDown(reduceMotion)} className="flex-1 justify-center py-10">
          <Text variant="h1" className="text-4xl leading-tight" accessibilityRole="header">
            Learn trading.{'\n'}
            <Text className="text-accent">Practice the decision.</Text>
          </Text>
          <Text variant="body" className="mt-4 max-w-xl text-text-secondary">
            TradeAcademy helps you learn trading through education and simulated practice. No real
            money. No brokerage. No guaranteed signals. Anyone can try Guest mode. Accounts and
            purchases require age of majority.
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
              I understand Guest mode is a local educational demo. Scores do not predict prices.{' '}
              {BRAND.product} does not provide investment advice or buy/sell signals. Paper trading is
              simulated only.
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
