import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';
import { getLimit } from '@/features/subscription/services/entitlement.service';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { SubscriptionPlanId } from '@/features/subscription/types/subscription.types';
import { DEMO_USER_UID } from '@/firebase/config';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { LAUNCH_FEATURE_COMPARISON } from '@/shared/constants/monetization';
import { legalPath } from '@/shared/legal';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { PremiumBadge } from './PremiumBadge';

const OUTCOMES = [
  'Full Academy catalog and coaching context',
  'Full replay and Replay TV library',
  'Trading DNA and Personal Intelligence',
  'Process progression you can review',
  'Fair-use AI coaching — not buy/sell signals',
  'Export and deeper simulation review',
] as const;

export function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const remote = useRemoteConfig();
  const isGuest = user?.uid === DEMO_USER_UID;
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
    openCustomerCenter,
    nativeBillingAvailable,
  } = useSubscription();

  const defaultPlan = plans.find((p) => p.isPopular)?.id ?? 'yearly';
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(defaultPlan);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const freeLimits = useMemo(
    () => ({
      aiDaily: getLimit('aiDaily', 'free'),
      symbols: getLimit('symbolsPerWatchlist', 'free'),
    }),
    [remote],
  );
  const freeVsPremium = LAUNCH_FEATURE_COMPARISON;

  useEffect(() => {
    if (actionMessage) AccessibilityInfo.announceForAccessibility(actionMessage);
  }, [actionMessage]);

  useEffect(() => {
    if (plans.length && !plans.some((plan) => plan.id === selectedPlan)) {
      setSelectedPlan(plans.find((plan) => plan.isPopular)?.id ?? plans[0].id);
    }
  }, [plans, selectedPlan]);

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
    const isLifetime = subscription?.planId === 'lifetime';
    const expiryLabel = subscription?.expiresAt
      ? new Date(subscription.expiresAt).toLocaleDateString()
      : null;
    const statusText = isLifetime
      ? 'Aithera Pro Lifetime is active.'
      : subscription?.status === 'cancelled'
        ? `Cancelled — Aithera Pro remains active until ${expiryLabel ?? 'the end of the paid period'}.`
        : subscription?.status === 'grace_period' || subscription?.status === 'billing_issue'
          ? `Payment issue — Aithera Pro remains available until ${expiryLabel ?? 'the grace period ends'}.`
          : subscription?.willRenew
            ? `Renews ${expiryLabel ? `on ${expiryLabel}` : 'automatically'}.`
            : expiryLabel
              ? `Aithera Pro active until ${expiryLabel}.`
              : 'Aithera Pro is active.';

    return (
      <Screen scrollable>
        <Header title="Aithera Pro" onBack={() => router.back()} />
        <View className="items-center py-10">
          <PremiumBadge size="md" />
          <Text variant="h2" className="mt-4 text-center">
            You&apos;re on Aithera Pro
          </Text>
          <Text variant="body-sm" className="mt-2 text-center">
            Enjoy deeper Academy, Replay, Trading DNA, and review tools.
          Free remains a complete way to learn, practise, simulate, and journal.
          </Text>
          <Text variant="body-sm" className="mt-3 text-center text-text-secondary">
            {statusText}
          </Text>
          <Button
            variant="outline"
            className="mt-6"
            onPress={() =>
              void openCustomerCenter().catch((error: unknown) =>
                setActionMessage(
                  error instanceof Error ? error.message : 'Could not open Customer Center.',
                ),
              )
            }
          >
            {subscription?.status === 'cancelled' ? 'Resume in Customer Center' : 'Customer Center'}
          </Button>
          <Button variant="ghost" className="mt-3" onPress={() => void manage()}>
            Manage Subscription
          </Button>
          <Button
            variant="secondary"
            className="mt-6"
            onPress={() => refresh()}
            loading={isRefreshing}
          >
            Refresh Status
          </Button>
          {actionMessage ? (
            <Text variant="body-sm" className="mt-4 text-center text-text-secondary">
              {actionMessage}
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  const ctaLabel = selected?.isLifetime
    ? 'Continue with Lifetime'
    : selected?.trialDays && selectedPlan === 'yearly'
      ? `Start ${selected.trialLabel ?? `${selected.trialDays}-day free trial`}`
      : `Continue with ${selected?.title ?? 'Aithera Pro'}`;

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Aithera Pro" onBack={() => router.back()} />

      <View className="items-center py-6">
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="diamond" size={32} color={colors.accent.primary} />
        </View>
        <Text variant="h1" className="text-center">
          Grow calmer, clearer decisions
        </Text>
        <Text variant="body-sm" className="mt-2 max-w-sm text-center text-text-secondary">
          Free is a complete daily product. Premium adds depth, personalization, and
          progression — never buy/sell signals.
        </Text>
      </View>

      <View className="mb-5 rounded-2xl bg-accent-muted/50 p-4">
        <Text variant="label" className="mb-2 text-accent">
          7-day trial on yearly
        </Text>
        <Text variant="body-sm" className="text-text-secondary">
          Try Aithera Pro with no pressure. The trial applies only to Yearly when the store
          shows it. Free remains available if you cancel before the trial ends. Store prices
          control.
        </Text>
      </View>

      <View className="mb-5 rounded-2xl bg-background-elevated p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          Outcomes we coach toward
        </Text>
        {OUTCOMES.map((outcome) => (
          <Text key={outcome} variant="body-sm" className="mb-2 text-text-primary">
            ✓ {outcome}
          </Text>
        ))}
      </View>

      <View className="mb-5 rounded-2xl bg-surface p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          Free vs Premium
        </Text>
        <View className="mb-2 flex-row">
          <Text variant="caption" className="w-[36%] text-text-tertiary">
            Capability
          </Text>
          <Text variant="caption" className="w-[32%] text-text-tertiary">
            Free
          </Text>
          <Text variant="caption" className="w-[32%] text-text-tertiary">
            Premium
          </Text>
        </View>
        {freeVsPremium.map((row) => (
          <View key={row.feature} className="mb-2 flex-row">
            <Text variant="caption" className="w-[36%] text-text-primary">
              {row.feature}
            </Text>
            <Text variant="caption" className="w-[32%] text-text-secondary">
              {row.free}
            </Text>
            <Text variant="caption" className="w-[32%] text-accent">
              {row.premium}
            </Text>
          </View>
        ))}
      </View>

      {!nativeBillingAvailable ? (
        <View className="mb-5 rounded-2xl bg-background-elevated p-4">
          <Text variant="body-sm" className="text-center">
            Store purchases are available in EAS development and production builds. Expo Go and demo
            mode remain free.
          </Text>
        </View>
      ) : null}

      {isGuest ? (
        <View className="mb-5 rounded-2xl bg-accent-muted p-4">
          <Text variant="label" className="text-accent">
            Create an eligible account before subscribing
          </Text>
          <Text variant="body-sm" className="mt-1">
            Subscriptions require an account for users who are at least 18 (or the age of majority
            where you live) so Aithera Pro can be restored across devices. Guest mode stays local
            and free to explore.
          </Text>
        </View>
      ) : null}

      {subscription?.status === 'expired' || subscription?.status === 'refunded' ? (
        <Text variant="body-sm" className="mb-4 text-center text-text-secondary">
          Your previous subscription is no longer active. Choose a plan to resubscribe.
        </Text>
      ) : null}

      <View className={cn(layout.columns === 2 && 'flex-row items-start gap-4')}>
          <View className={cn(layout.columns === 2 && 'flex-1')}>
            <View className="mb-5 flex-row flex-wrap rounded-2xl bg-surface p-1">
              {plans.map((plan) => {
                const active = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    accessibilityRole="radio"
                    accessibilityLabel={`${plan.title}, ${plan.price}${plan.pricePerMonth ? `, ${plan.pricePerMonth}` : ''}${plan.trialLabel ? `, ${plan.trialLabel}` : ''}`}
                    accessibilityState={{ checked: active }}
                    onPress={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'min-h-11 min-w-[30%] flex-1 items-center justify-center rounded-xl px-2 py-3',
                      active && 'bg-background-elevated',
                    )}
                  >
                    <Text
                      variant="body-sm"
                      className={cn(
                        'font-semibold',
                        active ? 'text-text-primary' : 'text-text-secondary',
                      )}
                    >
                      {plan.title}
                    </Text>
                    {plan.badge ? (
                      <Text
                        variant="caption"
                        className={active ? 'text-accent' : 'text-text-tertiary'}
                      >
                        {plan.badge}
                      </Text>
                    ) : plan.trialLabel ? (
                      <Text
                        variant="caption"
                        className={active ? 'text-accent' : 'text-text-tertiary'}
                      >
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

            <View className="mb-5 rounded-2xl bg-background-elevated p-5">
              <View className="flex-row items-end justify-between">
                <View className="flex-1 pr-3">
                  <Text variant="h3">
                    {selected?.title} {selected?.isLifetime ? '' : 'Pro'}
                  </Text>
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
          </View>

          <View
            className={cn(
              'mb-6 rounded-2xl bg-background-elevated p-4',
              layout.columns === 2 && 'mb-5 flex-1',
            )}
          >
            <Text variant="label" className="mb-3 text-text-tertiary">
              What Premium deepens
            </Text>
            {OUTCOMES.map((outcome) => (
              <View key={outcome} className="mb-3 flex-row items-center last:mb-0">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
                  <Ionicons name="checkmark" size={16} color={colors.accent.primary} />
                </View>
                <Text variant="body" className="flex-1">
                  {outcome}
                </Text>
              </View>
            ))}
          </View>
        </View>

      <Button
        className="mt-1"
        fullWidth
        size="lg"
        loading={isPurchasing}
        disabled={!isGuest && !nativeBillingAvailable}
        onPress={() =>
          isGuest ? router.push('/(auth)/register' as never) : void handlePurchase()
        }
      >
        {isGuest ? 'Create account to subscribe' : ctaLabel}
      </Button>

      <Button
        variant="ghost"
        className="mt-3"
        fullWidth
        loading={isRestoring}
        disabled={isGuest || !nativeBillingAvailable}
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
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          variant="body-sm"
          className="mt-3 text-center text-text-secondary"
        >
          {actionMessage}
        </Text>
      ) : null}

      <Text variant="caption" className="mt-4 text-center leading-5 text-text-secondary">
        Payment is charged to your Apple ID or Google Play account at confirmation. Subscriptions
        auto-renew unless cancelled at least 24 hours before the end of the current period in your
        store account settings. After a free trial, the listed plan price is charged. Cancelling
        stops renewal; Aithera Pro remains available until the paid-through date. Free remains
        available afterwards. Prices shown come from the store when available. Aithera Pro does
        not provide brokerage execution or exchange-tick realtime data. Lifetime is a one-time
        purchase and does not auto-renew. Free includes {freeLimits.aiDaily} AI uses/day and up to{' '}
        {freeLimits.symbols} symbols in one research universe.
      </Text>

      <View className="mt-3 flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-4">
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(legalPath('terms'))}
        >
          <Text variant="caption" className="text-accent">
            Terms of Service
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(legalPath('privacy'))}
        >
          <Text variant="caption" className="text-accent">
            Privacy Policy
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(legalPath('risk'))}
        >
          <Text variant="caption" className="text-accent">
            Risk Disclaimer
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(legalPath('support'))}
        >
          <Text variant="caption" className="text-accent">
            Support
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
