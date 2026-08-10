import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { useRiskCenter } from '@/features/decision/hooks/useDecision';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { HoldingForm } from '@/features/portfolio/components/HoldingForm';
import { HoldingRow } from '@/features/portfolio/components/HoldingRow';
import { PerformanceChart } from '@/features/portfolio/components/PerformanceChart';
import { RiskCalculatorForm } from '@/features/portfolio/components/RiskCalculatorForm';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import type { Holding } from '@/features/portfolio/types/portfolio.types';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { cn } from '@/shared/utils/cn';
import { formatChange, formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

type PortfolioPane = 'overview' | 'holdings';

export default function PortfolioScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const [pane, setPane] = useState<PortfolioPane>('overview');
  const [showSizer, setShowSizer] = useState(false);
  const [showHoldingForm, setShowHoldingForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [showAllHoldings, setShowAllHoldings] = useState(false);
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

  const pnlMap = useMemo(() => new Map(holdingPnLs.map((p) => [p.holdingId, p])), [holdingPnLs]);
  const rankedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aPnl = Math.abs(pnlMap.get(a.id)?.marketValue ?? 0);
      const bPnl = Math.abs(pnlMap.get(b.id)?.marketValue ?? 0);
      return bPnl - aPnl;
    });
  }, [holdings, pnlMap]);
  const visibleHoldings = showAllHoldings ? rankedHoldings : rankedHoldings.slice(0, 5);
  const topConcentration = rankedHoldings[0];
  const topConcentrationShare =
    topConcentration && summary.totalValue > 0
      ? ((pnlMap.get(topConcentration.id)?.marketValue ?? 0) / summary.totalValue) * 100
      : null;

  if (isLoading) {
    return (
      <ScreenScaffold title="Portfolio" scrollable={false} contentClassName="justify-center">
        <StatusState status="loading" title="Loading portfolio" description="Gathering holdings and risk context." />
      </ScreenScaffold>
    );
  }

  if (isError) {
    return (
      <ScreenScaffold title="Portfolio" scrollable={false}>
        <StatusState
          status="error"
          title="Unable to load portfolio"
          description="Holdings and risk context could not be refreshed. Cached marks are unavailable for this load."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </ScreenScaffold>
    );
  }

  const overview = (
    <View className="gap-4">
      <Surface tone="accent" emphasis="outlined" testID="portfolio-risk-lead">
        <Text variant="label" className="text-accent">
          RISK FIRST
        </Text>
        <Text variant="h2" headingLevel={2} className="mt-2">
          {riskQuery.data?.concentrationWarning
            ? 'Concentration needs attention'
            : holdings.length === 0
              ? 'No exposure yet'
              : 'Exposure looks manageable'}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {riskQuery.data?.concentrationWarning
            ? `${riskQuery.data.concentrationWarning}. ${riskQuery.data.recommendation}`
            : (riskQuery.data?.recommendation ??
              'Add holdings to see concentration and correlation risk.')}
        </Text>
        {topConcentration && topConcentrationShare != null ? (
          <Text variant="caption" className="mt-3 text-text-tertiary">
            Largest concentration: {topConcentration.symbol} · {topConcentrationShare.toFixed(0)}%
          </Text>
        ) : null}
        <EmbeddedAiInsight
          className="mt-3"
          title="Risk check"
          body={
            riskQuery.data?.recommendation ??
            'Open risk details when you want correlation and beta context.'
          }
          confidence={riskQuery.data ? Math.max(20, 100 - riskQuery.data.riskScore) : undefined}
          onExplain={() => router.push('/decision/risk' as never)}
          explainLabel="Open risk details"
        />
      </Surface>

      <Surface padding="sm" testID="portfolio-pnl-strip">
        <View className="flex-row flex-wrap gap-4">
          <View className="min-w-[40%] flex-1">
            <Text variant="caption" className="text-text-tertiary">
              Value
            </Text>
            <Text variant="mono">{formatPrice(summary.totalValue, summary.currency)}</Text>
          </View>
          <View className="min-w-[40%] flex-1">
            <Text variant="caption" className="text-text-tertiary">
              Total P&L
            </Text>
            <Text variant="mono" className={getPriceColorClass(summary.totalPnL)}>
              {formatChange(summary.totalPnL, summary.currency)} ({formatPercent(summary.totalPnLPercent)})
            </Text>
          </View>
          <View className="min-w-[40%] flex-1">
            <Text variant="caption" className="text-text-tertiary">
              Today
            </Text>
            <Text variant="mono" className={getPriceColorClass(summary.dayChange)}>
              {formatChange(summary.dayChange, summary.currency)} ({formatPercent(summary.dayChangePercent)})
            </Text>
          </View>
        </View>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          P&L is context only — coaching grades process and risk, never profits.
        </Text>
      </Surface>

      <CollapsibleSection
        title="Performance"
        description="Period returns and equity curve."
      >
        {performance ? (
          <PerformanceChart
            performance={performance}
            currency={summary.currency}
            onPeriodChange={setPerformancePeriod}
          />
        ) : (
          <Text variant="body-sm" className="text-text-secondary">
            Add holdings to unlock performance history.
          </Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Position sizing"
        description="Shares or contracts for a chosen risk percent."
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showSizer }}
          onPress={() => setShowSizer((v) => !v)}
          className="min-h-11 rounded-2xl bg-surface px-4 py-3.5"
        >
          <Text variant="label">
            {showSizer ? 'Hide position size tool' : 'Open position size tool'}
          </Text>
        </Pressable>
        {showSizer ? <RiskCalculatorForm currency={summary.currency} /> : null}
      </CollapsibleSection>
    </View>
  );

  const holdingsPane = (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text variant="h3" headingLevel={3}>
            Holdings
          </Text>
          <Text variant="caption" className="text-text-secondary">
            Largest exposures first · tap a row to edit
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add holding"
          onPress={() => {
            setEditingHolding(null);
            setShowHoldingForm(true);
          }}
          className="min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2"
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
        <StatusState
          status="empty"
          title="No holdings yet"
          description="Without positions, concentration and exposure risk stay invisible. Add a holding to make portfolio coaching useful."
          actionLabel="Add holding"
          onAction={() => {
            setEditingHolding(null);
            setShowHoldingForm(true);
          }}
        />
      ) : (
        <>
          {visibleHoldings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              pnl={pnlMap.get(holding.id)!}
              onPress={() => {
                setEditingHolding(holding);
                setShowHoldingForm(true);
              }}
            />
          ))}
          {rankedHoldings.length > 5 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllHoldings((value) => !value)}
              className="min-h-11 items-center justify-center rounded-xl bg-surface px-4"
            >
              <Text variant="label" className="text-accent">
                {showAllHoldings ? 'Show top holdings' : `View all ${rankedHoldings.length} holdings`}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <ScreenScaffold
      eyebrow="Portfolio"
      title="What risk deserves attention?"
      subtitle="Exposure and concentration first. P&L stays compact."
      contentClassName="pb-10"
      testID="portfolio-screen"
    >
      {layout.columns === 2 ? (
        <View className={cn('gap-4', 'flex-row items-start')}>
          <View className="flex-1 gap-4">{overview}</View>
          <View className="flex-1 gap-4">{holdingsPane}</View>
        </View>
      ) : (
        <View className="gap-4">
          <SegmentedControl
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'holdings', label: 'Holdings' },
            ]}
            value={pane}
            onChange={setPane}
            testID="portfolio-pane-control"
          />
          {pane === 'overview' ? overview : holdingsPane}
        </View>
      )}
    </ScreenScaffold>
  );
}
