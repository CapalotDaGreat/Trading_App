import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { LabEducationalOnboarding } from '@/features/educational/components/LabEducationalOnboarding';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { LabAccountCard, LabStatsCard } from '@/features/decision-lab/components/LabCards';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import {
  LAB_ACCOUNT_SIZES,
  LAB_CURRENCIES,
  LAB_SCENARIOS,
  type LabAccountSize,
  type LabCurrency,
  type LabScenarioId,
} from '@/features/decision-lab/types/lab.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

export default function DecisionLabHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ scenario?: string; symbol?: string }>();
  const account = useDecisionLabStore((s) => s.account);
  const setAccountSize = useDecisionLabStore((s) => s.setAccountSize);
  const setCurrency = useDecisionLabStore((s) => s.setCurrency);
  const resetAccount = useDecisionLabStore((s) => s.resetAccount);
  const resetDraft = useDecisionLabStore((s) => s.resetDraft);
  const getStats = useDecisionLabStore((s) => s.getStats);
  const getChallenges = useDecisionLabStore((s) => s.getChallenges);
  const getOpenPositions = useDecisionLabStore((s) => s.getOpenPositions);

  const [showSettings, setShowSettings] = useState(false);

  const openPositions = getOpenPositions();
  const stats = getStats();
  const challenges = getChallenges();

  const startThesis = (scenarioId?: LabScenarioId) => {
    const scenario = (params.scenario as LabScenarioId | undefined) ?? scenarioId ?? 'freeform';
    resetDraft(scenario, params.symbol);
    router.push('/decision/lab/thesis' as never);
  };

  return (
    <Screen scrollable>
      <Header
        title="Decision Lab"
        subtitle="Educational simulation — no real money, no brokerage, no execution"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4 pb-10">
        <EducationalModeBadge />
        <LabEducationalOnboarding />

        <GlassCard className="p-4">
          <Text variant="caption" className="mb-2 font-semibold text-text-tertiary">
            EDUCATIONAL PRACTICE ONLY
          </Text>
          <Text variant="body-sm" className="leading-relaxed text-text-secondary">
            Decision Lab is simulated learning. It is not a broker, does not execute live orders,
            does not handle real money, and does not provide financial advice. Every practice trade
            requires a complete thesis — process training, not profit claims.
          </Text>
        </GlassCard>

        <LabAccountCard
          currency={account.currency}
          cash={account.cash}
          size={account.size}
          openCount={openPositions.length}
        />

        <Button onPress={() => startThesis()}>Create thesis</Button>

        <View>
          <Text variant="h3" className="mb-2">
            Academy scenarios
          </Text>
          <View className="gap-2">
            {LAB_SCENARIOS.map((sc) => (
              <Pressable
                key={sc.id}
                onPress={() => startThesis(sc.id)}
                className="rounded-2xl bg-background-elevated px-4 py-3"
              >
                <Text variant="label" className="text-text-primary">
                  {sc.title}
                </Text>
                <Text variant="caption" className="mt-0.5 text-text-secondary">
                  {sc.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {openPositions.length > 0 ? (
          <View>
            <Text variant="h3" className="mb-2">
              Open Lab positions
            </Text>
            {openPositions.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/decision/lab/${p.id}` as never)}
                className="mb-2 rounded-2xl bg-background-elevated px-4 py-3"
              >
                <Text variant="label">
                  {p.thesis.symbol} · {p.thesis.bias}
                </Text>
                <Text variant="caption" className="text-text-secondary">
                  Entry {p.entryPrice.toFixed(2)} · qty {p.quantity} · R:R {p.thesis.riskReward}:1
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <PremiumOsGate feature="decisionLab">
          <View className="gap-4">
            <LabStatsCard stats={stats} />

            <GlassCard className="p-4">
              <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
                DISCIPLINE CHALLENGES
              </Text>
              <Text variant="h3" className="mb-3">
                Celebrate process
              </Text>
              {challenges.map((c) => (
                <View key={c.id} className="mb-3">
                  <View className="mb-1 flex-row justify-between">
                    <Text variant="label" className="flex-1 pr-2">
                      {c.title}
                    </Text>
                    <Text variant="caption" className="text-accent">
                      {c.progress}/{c.targetCount}
                    </Text>
                  </View>
                  <Text variant="caption" className="mb-1 text-text-secondary">
                    {c.description}
                  </Text>
                  <View className="h-2 overflow-hidden rounded-full bg-surface-active">
                    <View
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.min(100, (c.progress / c.targetCount) * 100)}%`,
                      }}
                    />
                  </View>
                  {c.completed ? (
                    <Text variant="caption" className="mt-1 text-bullish">
                      {c.celebrateCopy}
                    </Text>
                  ) : null}
                </View>
              ))}
            </GlassCard>
          </View>
        </PremiumOsGate>

        <Pressable
          onPress={() => router.push('/decision/decision-replay' as never)}
          accessibilityRole="button"
          accessibilityLabel="Open Review Process Tape"
          testID="lab-open-review"
          className="rounded-2xl bg-surface px-4 py-3"
        >
          <Text variant="label">Open Review</Text>
          <Text variant="caption" className="text-text-secondary">
            Review Lab decisions on your process tape
          </Text>
        </Pressable>

        <Pressable onPress={() => setShowSettings((v) => !v)}>
          <Text variant="caption" className="font-semibold text-accent">
            {showSettings ? 'Hide' : 'Account settings'}
          </Text>
        </Pressable>

        {showSettings ? (
          <GlassCard className="gap-3 p-4">
            <Text variant="caption" className="font-semibold text-text-tertiary">
              Virtual account size
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LAB_ACCOUNT_SIZES.map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setAccountSize(size as LabAccountSize)}
                  className={cn(
                    'rounded-full px-3 py-1.5',
                    account.size === size ? 'bg-accent-muted' : 'bg-surface',
                  )}
                >
                  <Text
                    variant="caption"
                    className={account.size === size ? 'text-accent' : 'text-text-secondary'}
                  >
                    {size.toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text variant="caption" className="font-semibold text-text-tertiary">
              Currency
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LAB_CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c as LabCurrency)}
                  className={cn(
                    'rounded-full px-3 py-1.5',
                    account.currency === c ? 'bg-accent-muted' : 'bg-surface',
                  )}
                >
                  <Text
                    variant="caption"
                    className={account.currency === c ? 'text-accent' : 'text-text-secondary'}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              variant="outline"
              onPress={() => {
                resetAccount();
              }}
            >
              Reset Lab account
            </Button>
            <Text variant="caption" className="text-text-tertiary">
              Changing size or resetting clears Lab positions. Never connected to a broker.
            </Text>
          </GlassCard>
        ) : null}

        <Pressable onPress={() => router.push('/academy' as never)}>
          <Text variant="caption" style={{ color: colors.accent.primary }}>
            Open Academy for practice scenarios →
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
