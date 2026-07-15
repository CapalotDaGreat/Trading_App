import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { RiskCenterCard } from '@/features/decision/components/RiskCenterCard';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { PortfolioSummary } from '@/features/portfolio/components/PortfolioSummary';
import { HoldingRow } from '@/features/portfolio/components/HoldingRow';
import { PerformanceChart } from '@/features/portfolio/components/PerformanceChart';
import { RiskCalculatorForm } from '@/features/portfolio/components/RiskCalculatorForm';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export default function PortfolioScreen() {
  const router = useRouter();
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

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00D4AA" />
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
  const topWeight = holdings[0]?.symbol;

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Portfolio" subtitle="Track holdings & P&L" transparent />

      <View className="mt-4 gap-4">
        <PortfolioSummary summary={summary} />

        <EmbeddedAiInsight
          title="Portfolio decision check"
          body={
            riskQuery.data?.concentrationWarning
              ? `${riskQuery.data.concentrationWarning}. ${riskQuery.data.recommendation}`
              : (riskQuery.data?.recommendation ??
                'Track holdings to unlock concentration and correlation insights.')
          }
          confidence={riskQuery.data ? 100 - riskQuery.data.riskScore : undefined}
          onExplain={() => router.push('/decision/risk' as never)}
        />

        {performance ? (
          <PerformanceChart
            performance={performance}
            currency={summary.currency}
            onPeriodChange={setPerformancePeriod}
          />
        ) : null}

        {riskQuery.data ? <RiskCenterCard data={riskQuery.data} /> : null}

        <View>
          <Text variant="h3" className="mb-2">
            Holdings
          </Text>
          {holdings.length === 0 ? (
            <EmptyState
              title="No holdings yet"
              description="Add positions to track your portfolio performance."
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
          {topWeight ? (
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Tip: open {topWeight} on Setup Radar before adding size.
            </Text>
          ) : null}
        </View>

        <RiskCalculatorForm currency={summary.currency} />
      </View>
    </Screen>
  );
}
