import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { HoldingForm } from '@/features/portfolio/components/HoldingForm';
import { HoldingRow } from '@/features/portfolio/components/HoldingRow';
import { PerformanceChart } from '@/features/portfolio/components/PerformanceChart';
import { PortfolioSummary } from '@/features/portfolio/components/PortfolioSummary';
import { RiskCalculatorForm } from '@/features/portfolio/components/RiskCalculatorForm';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import type { Holding } from '@/features/portfolio/types/portfolio.types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [showSizer, setShowSizer] = useState(false);
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const { mutateAsync: appendDecisionRecord } = useAppendDecisionRecord();
  const {
    holdings,
    holdingPnLs,
    summary,
    performance,
    setPerformancePeriod,
    isLoading,
    isError,
    refetch,
    createHolding,
    updateHolding,
    deleteHolding,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePortfolio();
  const riskQuery = useRiskCenter();

  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    void AsyncStorage.getItem('tradevision-portfolio-reviewed-day').then((v) => {
      if (v === day) return;
      void appendDecisionRecord({
        symbol: '',
        regime: 'portfolio',
        action: 'portfolio_reviewed',
        note: 'Portfolio tab reviewed',
      });
      void AsyncStorage.setItem('tradevision-portfolio-reviewed-day', day);
    });
  }, [appendDecisionRecord]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Unable to load portfolio"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const pnlMap = new Map(holdingPnLs.map((p) => [p.holdingId, p]));

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Portfolio" subtitle="Holdings, P&L, then risk" transparent />

      <View className="mt-4 gap-4">
        <PortfolioSummary summary={summary} />

        <EmbeddedAiInsight
          title="Risk check"
          body={
            riskQuery.data?.concentrationWarning
              ? `${riskQuery.data.concentrationWarning}. ${riskQuery.data.recommendation}`
              : (riskQuery.data?.recommendation ??
                'Add holdings to see concentration and correlation risk.')
          }
          confidence={riskQuery.data ? Math.max(20, 100 - riskQuery.data.riskScore) : undefined}
          onExplain={() => router.push('/decision/risk' as never)}
          explainLabel="Open risk details"
        />

        {performance ? (
          <PerformanceChart
            performance={performance}
            currency={summary.currency}
            onPeriodChange={setPerformancePeriod}
          />
        ) : null}

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <View>
              <Text variant="h3">Holdings</Text>
              <Text variant="caption" className="text-text-secondary">
                Tap a row to edit
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setEditingHolding(null);
                setShowHoldingForm(true);
              }}
              className="rounded-full bg-accent px-4 py-2"
            >
              <Text variant="label" className="text-text-inverse">
                Add
              </Text>
            </Pressable>
          </View>
          {showHoldingForm ? (
            <HoldingForm
              holding={editingHolding}
              isSaving={isCreating || isUpdating}
              isDeleting={isDeleting}
              onCreate={createHolding}
              onUpdate={(holdingId, updates) => updateHolding({ holdingId, updates })}
              onDelete={deleteHolding}
              onClose={() => {
                setShowHoldingForm(false);
                setEditingHolding(null);
              }}
            />
          ) : null}
          {holdings.length === 0 ? (
            <EmptyState
              title="No holdings yet"
              description="Add positions to track portfolio performance."
            />
          ) : (
            holdings.map((holding) => (
              <HoldingRow
                key={holding.id}
                holding={holding}
                pnl={pnlMap.get(holding.id)!}
                onPress={() => {
                  setEditingHolding(holding);
                  setShowHoldingForm(true);
                }}
              />
            ))
          )}
        </View>

        <Pressable
          onPress={() => setShowSizer((v) => !v)}
          className="rounded-2xl bg-surface px-4 py-3.5"
        >
          <Text variant="label">
            {showSizer ? 'Hide position size tool' : 'Position size tool'}
          </Text>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            How many shares/contracts for your risk %
          </Text>
        </Pressable>

        {showSizer ? <RiskCalculatorForm currency={summary.currency} /> : null}
      </View>
    </Screen>
  );
}
