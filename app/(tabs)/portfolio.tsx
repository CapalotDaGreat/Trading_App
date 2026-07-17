import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { PortfolioSummary } from '@/features/portfolio/components/PortfolioSummary';
import { HoldingRow } from '@/features/portfolio/components/HoldingRow';
import { PerformanceChart } from '@/features/portfolio/components/PerformanceChart';
import { RiskCalculatorForm } from '@/features/portfolio/components/RiskCalculatorForm';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [showSizer, setShowSizer] = useState(false);
  const appendDecision = useAppendDecisionRecord();
  const {
    holdings,
    holdingPnLs,
    summary,
    performance,
    setPerformancePeriod,
    isLoading,
    isError,
    refetch,
    deleteHolding,
  } = usePortfolio();
  const riskQuery = useRiskCenter();

  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    void AsyncStorage.getItem('tradevision-portfolio-reviewed-day').then((v) => {
      if (v === day) return;
      void appendDecision.mutateAsync({
        symbol: '',
        regime: 'portfolio',
        action: 'portfolio_reviewed',
        note: 'Portfolio tab reviewed',
      });
      void AsyncStorage.setItem('tradevision-portfolio-reviewed-day', day);
    });
  }, []);

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
          <Text variant="h3" className="mb-1">
            Holdings
          </Text>
          <Text variant="caption" className="mb-2 text-text-secondary">
            Long-press a row to remove it
          </Text>
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
                onLongPress={() => void deleteHolding(holding.id)}
              />
            ))
          )}
        </View>

        <Pressable
          onPress={() => setShowSizer((v) => !v)}
          className="rounded-2xl bg-surface px-4 py-3.5"
        >
          <Text variant="label">{showSizer ? 'Hide position size tool' : 'Position size tool'}</Text>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            How many shares/contracts for your risk %
          </Text>
        </Pressable>

        {showSizer ? <RiskCalculatorForm currency={summary.currency} /> : null}
      </View>
    </Screen>
  );
}
