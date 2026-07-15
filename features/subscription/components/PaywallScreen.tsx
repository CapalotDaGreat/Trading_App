import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { SubscriptionPlanId } from '@/features/subscription/types/subscription.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { SUBSCRIPTION_TIERS } from '@/shared/constants/subscription';

import { PlanCard } from './PlanCard';
import { PremiumBadge } from './PremiumBadge';

const PREMIUM_FEATURES = [
  { icon: 'analytics' as const, label: '25 AI analyses per day' },
  { icon: 'flash' as const, label: 'Real-time market quotes' },
  { icon: 'bar-chart' as const, label: 'Advanced charting tools' },
  { icon: 'briefcase' as const, label: 'Portfolio tracking' },
  { icon: 'notifications-off' as const, label: 'Ad-free experience' },
  { icon: 'download' as const, label: 'Data export' },
];

export function PaywallScreen() {
  const router = useRouter();
  const {
    plans,
    isPremium,
    isLoading,
    purchase,
    isPurchasing,
    restore,
    isRestoring,
    refresh,
    isRefreshing,
  } = useSubscription();

  const defaultPlan = plans.find((p) => p.isPopular)?.id ?? 'yearly';
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(defaultPlan);

  const handlePurchase = async () => {
    await purchase(selectedPlan);
    await refresh();
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#00D4AA" size="large" />
      </Screen>
    );
  }

  if (isPremium) {
    return (
      <Screen scrollable>
        <Header title="Premium" onBack={() => router.back()} />
        <View className="items-center py-10">
          <PremiumBadge size="md" />
          <Text variant="h2" className="mt-4 text-center">
            You&apos;re Premium
          </Text>
          <Text variant="body-sm" className="mt-2 text-center">
            Enjoy unlimited AI insights and ad-free trading.
          </Text>
          <Button variant="secondary" className="mt-6" onPress={() => refresh()} loading={isRefreshing}>
            Refresh Status
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Go Premium" onBack={() => router.back()} />

      <View className="items-center py-6">
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="diamond" size={32} color="#00D4AA" />
        </View>
        <Text variant="h1" className="text-center">
          TradeVision AI Premium
        </Text>
        <Text variant="body-sm" className="mt-2 max-w-xs text-center">
          Unlock AI-powered insights, real-time data, and an ad-free experience.
        </Text>
      </View>

      <GlassCard className="mb-6 p-4" glow>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.label} className="mb-3 flex-row items-center last:mb-0">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
              <Ionicons name={feature.icon} size={16} color="#00D4AA" />
            </View>
            <Text variant="body">{feature.label}</Text>
          </View>
        ))}
      </GlassCard>

      <View className="gap-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
          />
        ))}
      </View>

      <Button
        className="mt-6"
        fullWidth
        size="lg"
        loading={isPurchasing}
        onPress={() => void handlePurchase()}
      >
        Continue with {plans.find((p) => p.id === selectedPlan)?.title}
      </Button>

      <Button
        variant="ghost"
        className="mt-3"
        fullWidth
        loading={isRestoring}
        onPress={() => void restore()}
      >
        Restore Purchases
      </Button>

      <Text variant="caption" className="mt-4 text-center leading-5">
        Subscriptions auto-renew unless cancelled. Free tier includes{' '}
        {SUBSCRIPTION_TIERS.free.aiAnalysisPerDay} AI analyses per day.
      </Text>
    </Screen>
  );
}
