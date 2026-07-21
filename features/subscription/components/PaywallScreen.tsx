import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { SubscriptionPlanId } from '@/features/subscription/types/subscription.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { SUBSCRIPTION_TIERS } from '@/shared/constants/subscription';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { PremiumBadge } from './PremiumBadge';

const PREMIUM_FEATURES = [
  { icon: 'analytics' as const, label: 'Up to 100 AI analyses / day (fair use)' },
  { icon: 'sparkles' as const, label: 'Deeper rules-based decision context and explainability' },
  { icon: 'list' as const, label: 'Advanced Research Queue & conviction drift' },
  { icon: 'flash' as const, label: 'More frequent quote updates (~15–30s)' },
  { icon: 'briefcase' as const, label: 'Portfolio health, stress tests & concentration' },
  { icon: 'play-forward' as const, label: 'Advanced replay, DNA insights & decision timeline' },
  { icon: 'film' as const, label: 'Decision Replay process coach & weekly game tape' },
  { icon: 'flask' as const, label: 'Decision Lab · thesis-first paper practice' },
  { icon: 'calendar' as const, label: 'Sunday / weekly process reviews' },
  { icon: 'download' as const, label: 'Data export' },
];

export function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    plans,
    isPremium,
    subscription,
    isLoading,
    purchase,
    isPurchasing,
    restore,
    isRestoring,
    refresh,
    isRefreshing,
    manage,
    nativeBillingAvailable,
  } = useSubscription();

  const defaultPlan = plans.find((p) => p.isPopular)?.id ?? 'yearly';
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(defaultPlan);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => plans.find((p) => p.id === selectedPlan) ?? plans[0],
    [plans, selectedPlan],
  );

  const handlePurchase = async () => {
    setActionMessage(null);
    try {
      const result = await purchase(selectedPlan);
      setActionMessage(result.message);
      await refresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Purchase could not be completed.');
    }
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent.primary} size="large" />
      </Screen>
    );
  }

  if (isPremium) {
    const expiryLabel = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString()
      : null;
    const statusText =
      subscription?.status === 'cancelled'
        ? `Cancelled — Premium remains active until ${expiryLabel ?? 'the end of the paid period'}.`
        : subscription?.status === 'grace_period' || subscription?.status === 'billing_issue'
          ? `Payment issue — Premium remains available until ${expiryLabel ?? 'the grace period ends'}.`
          : subscription?.willRenew
            ? `Renews ${expiryLabel ? `on ${expiryLabel}` : 'automatically'}.`
            : expiryLabel
              ? `Premium active until ${expiryLabel}.`
              : 'Premium is active.';

    return (
      <Screen scrollable>
        <Header title="Premium" onBack={() => router.back()} />
        <View className="items-center py-10">
          <PremiumBadge size="md" />
          <Text variant="h2" className="mt-4 text-center">
            You&apos;re Premium
          </Text>
          <Text variant="body-sm" className="mt-2 text-center">
            Enjoy deeper decision coaching, faster data updates, and the full decision toolkit.
          </Text>
          <Text variant="body-sm" className="mt-3 text-center text-text-secondary">
            {statusText}
          </Text>
          <Button variant="outline" className="mt-6" onPress={() => void manage()}>
            {subscription?.status === 'cancelled' ? 'Resume Subscription' : 'Manage Subscription'}
          </Button>
          <Button variant="secondary" className="mt-6" onPress={() => refresh()} loading={isRefreshing}>
            Refresh Status
          </Button>
        </View>
      </Screen>
    );
  }

  const ctaLabel =
    selected?.trialDays && selectedPlan === 'yearly'
      ? `Start ${selected.trialLabel ?? `${selected.trialDays}-day free trial`}`
      : `Continue with ${selected?.title ?? 'Premium'}`;

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Go Premium" onBack={() => router.back()} />

      <View className="items-center py-6">
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="diamond" size={32} color={colors.accent.primary} />
        </View>
        <Text variant="h1" className="text-center">
          TradeVision AI Premium
        </Text>
        <Text variant="body-sm" className="mt-2 max-w-xs text-center">
          Unlock the full decision coach — deeper radar, portfolio tools, and replay.
        </Text>
      </View>

      {!nativeBillingAvailable ? (
        <View className="mb-5 rounded-2xl bg-background-elevated p-4">
          <Text variant="body-sm" className="text-center">
            Store purchases are available in EAS development and production builds. Expo Go and
            demo mode remain free.
          </Text>
        </View>
      ) : null}

      {subscription?.status === 'expired' || subscription?.status === 'refunded' ? (
        <Text variant="body-sm" className="mb-4 text-center text-text-secondary">
          Your previous subscription is no longer active. Choose a plan to resubscribe.
        </Text>
      ) : null}

      {/* Billing period toggle */}
      <View className="mb-5 flex-row rounded-2xl bg-surface p-1">
        {plans.map((plan) => {
          const active = selectedPlan === plan.id;
          return (
            <Pressable
              key={plan.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedPlan(plan.id)}
              className={cn(
                'flex-1 items-center rounded-xl px-2 py-3',
                active && 'bg-background-elevated',
              )}
            >
              <Text
                variant="body-sm"
                className={cn('font-semibold', active ? 'text-text-primary' : 'text-text-secondary')}
              >
                {plan.title}
              </Text>
              {plan.badge ? (
                <Text variant="caption" className={active ? 'text-accent' : 'text-text-tertiary'}>
                  {plan.badge}
                </Text>
              ) : plan.trialLabel ? (
                <Text variant="caption" className={active ? 'text-accent' : 'text-text-tertiary'}>
                  {plan.trialLabel}
                </Text>
              ) : (
                <Text variant="caption" className="text-text-tertiary">
                  Flexible
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected plan price card */}
      <View className="mb-5 rounded-2xl bg-background-elevated p-5">
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text variant="h3">{selected?.title} Premium</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {selected?.description}
            </Text>
            {selected?.trialLabel ? (
              <Text variant="caption" className="mt-2 text-accent">
                Includes {selected.trialLabel} — cancel anytime before it ends
              </Text>
            ) : null}
            {selected?.savingsPercent && !selected.trialLabel ? (
              <Text variant="caption" className="mt-2 text-accent">
                Save {selected.savingsPercent}% vs monthly
              </Text>
            ) : null}
          </View>
          <View className="items-end">
            <Text variant="price">{selected?.price}</Text>
            {selected?.pricePerMonth ? (
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                {selected.pricePerMonth}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mb-6 rounded-2xl bg-background-elevated p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          EVERYTHING IN PREMIUM
        </Text>
        {PREMIUM_FEATURES.map((feature) => (
          <View key={feature.label} className="mb-3 flex-row items-center last:mb-0">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
              <Ionicons name={feature.icon} size={16} color={colors.accent.primary} />
            </View>
            <Text variant="body" className="flex-1">
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      <Button
        className="mt-1"
        fullWidth
        size="lg"
        loading={isPurchasing}
        disabled={!nativeBillingAvailable}
        onPress={() => void handlePurchase()}
      >
        {ctaLabel}
      </Button>

      <Button
        variant="ghost"
        className="mt-3"
        fullWidth
        loading={isRestoring}
        disabled={!nativeBillingAvailable}
        onPress={() => {
          setActionMessage(null);
          void restore()
            .then((record) =>
              setActionMessage(
                record.isPremium
                  ? 'Purchases restored.'
                  : 'No active purchase was found for this store account.',
              ),
            )
            .catch((error: unknown) =>
              setActionMessage(
                error instanceof Error ? error.message : 'Purchases could not be restored.',
              ),
            );
        }}
      >
        Restore Purchases
      </Button>

      {actionMessage ? (
        <Text variant="body-sm" className="mt-3 text-center text-text-secondary">
          {actionMessage}
        </Text>
      ) : null}

      <Text variant="caption" className="mt-4 text-center leading-5">
        Subscriptions auto-renew unless cancelled. Quote refresh is faster polling of delayed data —
        not exchange-tick realtime. Free includes{' '}
        {SUBSCRIPTION_TIERS.free.aiAnalysisPerDay} AI analyses/day and up to{' '}
        {SUBSCRIPTION_TIERS.free.watchlistMax} watchlist symbols.
      </Text>
    </Screen>
  );
}
