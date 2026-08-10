import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AiDebateCard } from '@/features/ai/components/AiDebateCard';
import { useAiDebate } from '@/features/ai/hooks/useAiDebate';
import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { IndicatorPanel } from '@/features/charts/components/IndicatorPanel';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { useChartData } from '@/features/charts/hooks/useChartData';
import type { IndicatorType } from '@/features/charts/utils/indicators';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import { MtfConsensusCard } from '@/features/decision/components/MtfConsensusCard';
import { useMtfConsensus, useRegime } from '@/features/decision/hooks/useDecision';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import type { DecisionAction } from '@/features/decision-log/services/decision-log.service';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { getDataFreshness } from '@/features/markets/constants/freshness';
import { useMarketQuote } from '@/features/markets/hooks/useMarketQuote';
import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import { AddToWatchlistSheet } from '@/features/watchlists/components/AddToWatchlistSheet';
import { AccessibleChartFrame } from '@/shared/components/charts/AccessibleChartFrame';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval, MarketType } from '@/shared/types/market';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { cn } from '@/shared/utils/cn';
import {
  formatChange,
  formatPercent,
  formatPrice,
  formatVolume,
  getPriceColorClass,
} from '@/shared/utils/format';
import { getPriceAccessibilityLabel } from '@/shared/utils/accessibility';

type DetailTab = 'decision' | 'chart' | 'indicators' | 'advanced';

function resolveTab(raw?: string): DetailTab {
  if (raw === 'chart') return 'chart';
  if (raw === 'indicators' || raw === 'details') return 'indicators';
  if (raw === 'advanced' || raw === 'debate' || raw === 'analysis') return 'advanced';
  return 'decision';
}

export default function AssetDetailScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const params = useLocalSearchParams<{ symbol: string; marketType?: string; tab?: string }>();
  const symbol = decodeURIComponent(params.symbol ?? '');
  const marketType = (params.marketType as MarketType) ?? undefined;

  const [interval, setInterval] = useState<CandleInterval>('1d');
  const [activeTab, setActiveTab] = useState<DetailTab>(() => resolveTab(params.tab));
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>([
    'rsi',
    'macd',
    'bollinger',
  ]);
  const [watchlistSheetVisible, setWatchlistSheetVisible] = useState(false);

  const asset = useMemo(() => buildAssetFromSymbol(symbol, marketType), [symbol, marketType]);

  const needsChartWork =
    activeTab === 'decision' || activeTab === 'chart' || activeTab === 'indicators';
  const needsMtf = activeTab === 'decision' || activeTab === 'advanced';
  const needsRegime = activeTab === 'decision' || activeTab === 'advanced';
  const needsDebate = activeTab === 'advanced';

  const { data: quote, isLoading: quoteLoading } = useMarketQuote({
    symbol,
    marketType: asset.marketType,
  });

  const {
    candles,
    analysis,
    isLoading: chartLoading,
    dataUpdatedAt,
    source: chartSource,
  } = useChartData({
    symbol,
    interval,
    marketType: asset.marketType,
    indicators: activeIndicators,
    enabled: needsChartWork,
  });
  const mtfQuery = useMtfConsensus(symbol, { enabled: needsMtf });
  const regimeQuery = useRegime({ enabled: needsRegime });
  const debateQuery = useAiDebate(symbol, interval, needsDebate);
  const appendDecision = useAppendDecisionRecord();
  const loggedRef = useRef(false);
  const [decisionOutcome, setDecisionOutcome] = useState<DecisionAction | null>(null);

  useEffect(() => {
    setActiveTab(resolveTab(params.tab));
  }, [params.tab]);

  useEffect(() => {
    if (!symbol || !regimeQuery.data || loggedRef.current) return;
    loggedRef.current = true;
    void appendDecision.mutateAsync({
      symbol,
      regime: regimeQuery.data.label,
      action: 'opened',
      bias: analysis?.summary.overallBias,
      note: 'Asset decision tab opened',
      eventKey: `asset-opened:${symbol.toUpperCase()}:${new Date().toISOString().slice(0, 10)}`,
    });
  }, [symbol, regimeQuery.data, analysis?.summary.overallBias, appendDecision]);

  const recordOutcome = useCallback(
    (action: 'researched' | 'skipped' | 'ignored') => {
      if (!symbol || !regimeQuery.data || !analysis) return;
      const score = Math.round(analysis.summary.confidence * 100);
      const invalidation =
        analysis.summary.overallBias === 'bearish'
          ? analysis.summary.resistanceLevels[0]
          : analysis.summary.supportLevels[0];
      appendDecision.mutate(
        {
          symbol,
          regime: regimeQuery.data.label,
          action,
          setupScore: score,
          bias: analysis.summary.overallBias,
          invalidation: invalidation != null ? String(invalidation) : undefined,
          note: `Asset decision · ${analysis.summary.trend} · chart context ${score}`,
          eventKey: `asset-outcome:${symbol.toUpperCase()}:${action}:${new Date().toISOString().slice(0, 10)}`,
        },
        { onSuccess: () => setDecisionOutcome(action) },
      );
    },
    [analysis, appendDecision, regimeQuery.data, symbol],
  );

  const toggleIndicator = useCallback((indicator: IndicatorType) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator],
    );
  }, []);

  const changeClass = quote ? getPriceColorClass(quote.change) : 'text-text-secondary';
  const researchPriority = analysis ? Math.round(analysis.summary.confidence * 100) : null;

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'decision', label: 'Decision' },
    { key: 'chart', label: 'Chart' },
    { key: 'indicators', label: 'Indicators' },
    { key: 'advanced', label: 'Advanced' },
  ];

  return (
    <ScreenScaffold
      title={asset.symbol}
      subtitle={asset.name}
      showBack
      contentClassName="pb-10"
      headerAction={
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: '/ai', params: { symbol, source: 'asset' } } as never)
            }
          >
            Ask
          </Button>
          <Button size="sm" variant="outline" onPress={() => setWatchlistSheetVisible(true)}>
            Watch
          </Button>
        </View>
      }
      testID="asset-detail-screen"
    >
      <View className="gap-4">
        {quoteLoading ? (
          <Skeleton height={48} />
        ) : quote ? (
          <Surface padding="sm" tone="subtle" testID="asset-price-provenance">
            <Text
              variant="price-lg"
              className={changeClass}
              accessibilityLabel={getPriceAccessibilityLabel(
                asset.symbol,
                quote.price,
                quote.changePercent,
              )}
            >
              {formatPrice(quote.price, quote.currency)}
            </Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-2">
              <Text variant="body-sm" className={changeClass}>
                {formatChange(quote.change, quote.currency)} ({formatPercent(quote.changePercent)})
              </Text>
              <Badge label={quote.status} size="sm" variant="outline" />
              <DataSourceBadge kind={quote.dataSourceKind} />
              <DataFreshnessBadge fetchedAt={quote.fetchedAt ?? dataUpdatedAt} />
            </View>
          </Surface>
        ) : null}

        <View className="flex-row rounded-2xl bg-surface p-1" accessibilityRole="tablist">
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                router.replace({
                  pathname: '/asset/[symbol]',
                  params: { ...params, symbol, tab: tab.key },
                } as never);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
              accessibilityLabel={`Show ${tab.label} for ${asset.symbol}`}
              testID={`asset-tab-${tab.key}`}
              className={cn(
                'min-h-11 flex-1 justify-center rounded-lg py-2',
                activeTab === tab.key && 'bg-accent-muted',
              )}
            >
              <Text
                variant="caption"
                className={cn(
                  'text-center font-semibold',
                  activeTab === tab.key ? 'text-accent' : 'text-text-secondary',
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'decision' ? (
          <View className="gap-4" testID="asset-decision-panel">
            {!analysis && chartLoading ? <Skeleton height={180} rounded="lg" /> : null}
            {analysis ? (
              <>
                <Surface>
                  <Text variant="label" className="text-accent">
                    RESEARCH PRIORITY
                  </Text>
                  <Text variant="h2" headingLevel={2} className="mt-2">
                    {researchPriority != null && researchPriority >= 65
                      ? 'Worth deeper research'
                      : researchPriority != null && researchPriority >= 40
                        ? 'Worth a watchlist check'
                        : 'Low research priority today'}
                  </Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    Decision-quality context {researchPriority}% · {analysis.summary.overallBias}{' '}
                    bias · {analysis.summary.trend}. This is not a buy or sell signal.
                  </Text>
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {chartSource ? <DataSourceBadge kind={chartSource.kind} /> : null}
                    <DataFreshnessBadge fetchedAt={chartSource?.fetchedAt ?? dataUpdatedAt} />
                  </View>
                </Surface>

                <Surface>
                  <Text variant="h3" headingLevel={3}>
                    Decision summary
                  </Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    Thesis: {analysis.summary.trend} with {analysis.summary.rsiSignal} RSI and{' '}
                    {analysis.summary.macdSignal} MACD context.
                  </Text>
                  {analysis.summary.supportLevels[0] ? (
                    <Text variant="caption" className="mt-2 text-bearish">
                      Invalidation (long thesis): below{' '}
                      {formatPrice(analysis.summary.supportLevels[0], quote?.currency)}
                    </Text>
                  ) : null}
                  {analysis.summary.resistanceLevels[0] ? (
                    <Text variant="caption" className="mt-1 text-bearish">
                      Invalidation (short thesis): above{' '}
                      {formatPrice(analysis.summary.resistanceLevels[0], quote?.currency)}
                    </Text>
                  ) : null}
                  {mtfQuery.data ? (
                    <View className="mt-3">
                      <MtfConsensusCard data={mtfQuery.data} />
                    </View>
                  ) : null}
                </Surface>

                <Surface>
                  <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
                    ATTENTION DECISION
                  </Text>
                  <Text variant="h3" headingLevel={3}>
                    What should happen next?
                  </Text>
                  <Text variant="caption" className="mt-1 text-text-secondary">
                    Log the research outcome — not a buy or sell signal.
                  </Text>
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    <Button
                      size="sm"
                      onPress={() => recordOutcome('researched')}
                      disabled={appendDecision.isPending}
                    >
                      Research
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => recordOutcome('skipped')}
                      disabled={appendDecision.isPending}
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => recordOutcome('ignored')}
                      disabled={appendDecision.isPending}
                    >
                      Ignore
                    </Button>
                  </View>
                  {decisionOutcome ? (
                    <Text variant="caption" className="mt-2 text-accent">
                      Logged:{' '}
                      {decisionOutcome === 'researched'
                        ? 'Research'
                        : decisionOutcome === 'skipped'
                          ? 'Skip'
                          : 'Ignore'}
                    </Text>
                  ) : null}
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push('/journal' as never)}
                  >
                    Journal this research
                  </Button>
                </Surface>

                <CollapsibleSection
                  title="Explainability"
                  description="Evidence factors behind this research priority."
                >
                  <ExplainabilityBlock
                    explainability={{
                      confidence: Math.round(analysis.summary.confidence * 100),
                      factors: [
                        { label: 'Trend', agrees: true, detail: analysis.summary.trend },
                        {
                          label: 'RSI',
                          agrees: analysis.summary.rsiSignal !== 'neutral',
                          detail: analysis.summary.rsiSignal,
                        },
                        {
                          label: 'MACD',
                          agrees: analysis.summary.macdSignal !== 'neutral',
                          detail: analysis.summary.macdSignal,
                        },
                      ],
                      agrees: 2,
                      disagrees: 1,
                      dataAsOf: dataUpdatedAt ?? Date.now(),
                      freshness: getDataFreshness(chartSource?.fetchedAt),
                      reasoning:
                        'Decision tab summarizes whether this symbol deserves research time today.',
                    }}
                  />
                </CollapsibleSection>
              </>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'chart' ? (
          <View className="gap-4" testID="asset-chart-panel">
            <TimeframeSelector value={interval} onChange={setInterval} />
            {quote ? (
              <View className="flex-row flex-wrap gap-4">
                <View>
                  <Text variant="caption">Open</Text>
                  <Text variant="mono">{formatPrice(quote.open, quote.currency)}</Text>
                </View>
                <View>
                  <Text variant="caption">High</Text>
                  <Text variant="mono">{formatPrice(quote.high, quote.currency)}</Text>
                </View>
                <View>
                  <Text variant="caption">Low</Text>
                  <Text variant="mono">{formatPrice(quote.low, quote.currency)}</Text>
                </View>
                <View>
                  <Text variant="caption">Volume</Text>
                  <Text variant="mono">{formatVolume(quote.volume)}</Text>
                </View>
              </View>
            ) : null}
            <AccessibleChartFrame
              title={`${asset.symbol} chart`}
              timeRange={interval}
              source={
                chartSource
                  ? `${chartSource.kind} · ${chartSource.provider}`
                  : 'Source pending'
              }
              freshness={
                chartSource
                  ? `Fetched ${new Date(chartSource.fetchedAt).toLocaleTimeString()}`
                  : 'Freshness unknown'
              }
              summary={
                analysis
                  ? `${analysis.summary.overallBias} bias with ${analysis.summary.trend} trend context.`
                  : 'Price history for research context only.'
              }
              textualAlternative={
                quote
                  ? `Last ${formatPrice(quote.price, quote.currency)}; open ${formatPrice(quote.open, quote.currency)}; high ${formatPrice(quote.high, quote.currency)}; low ${formatPrice(quote.low, quote.currency)}; volume ${formatVolume(quote.volume)}.`
                  : 'Quote details are not available for a textual chart alternative yet.'
              }
            >
              <Surface padding="sm" className="overflow-hidden">
                <CandlestickChart
                  candles={candles}
                  isLoading={chartLoading}
                  currency={quote?.currency}
                  height={layout.isLandscape ? 360 : 300}
                  symbol={asset.symbol}
                />
              </Surface>
            </AccessibleChartFrame>
          </View>
        ) : null}

        {activeTab === 'indicators' ? (
          <View className="mb-2 gap-4" testID="asset-indicators-panel">
            <IndicatorPanel active={activeIndicators} onToggle={toggleIndicator} />
            {analysis?.indicators.rsi ? (
              <Surface>
                <Text variant="label" className="mb-2">
                  RSI (14)
                </Text>
                <Text variant="price">
                  {(
                    (analysis.indicators.rsi as { values: { value: number }[] }).values.slice(-1)[0]
                      ?.value ?? 0
                  ).toFixed(2)}
                </Text>
              </Surface>
            ) : null}
            {analysis?.indicators.macd ? (
              <Surface>
                <Text variant="label" className="mb-2">
                  MACD
                </Text>
                {(() => {
                  const macd = (
                    analysis.indicators.macd as {
                      values: { macd: number; signal: number; histogram: number }[];
                    }
                  ).values.slice(-1)[0];
                  return macd ? (
                    <View className="gap-1">
                      <Text variant="mono">MACD: {macd.macd.toFixed(4)}</Text>
                      <Text variant="mono">Signal: {macd.signal.toFixed(4)}</Text>
                      <Text
                        variant="mono"
                        className={macd.histogram >= 0 ? 'text-bullish' : 'text-bearish'}
                      >
                        Histogram: {macd.histogram.toFixed(4)}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </Surface>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'advanced' ? (
          <View className="gap-4" testID="asset-advanced-panel">
            {analysis?.summary.supportLevels.length ? (
              <Surface>
                <Text variant="label" className="mb-2">
                  Support levels
                </Text>
                {analysis.summary.supportLevels.map((level, i) => (
                  <Text key={i} variant="mono" className="text-bullish">
                    {formatPrice(level, quote?.currency)}
                  </Text>
                ))}
              </Surface>
            ) : null}
            {analysis?.summary.resistanceLevels.length ? (
              <Surface>
                <Text variant="label" className="mb-2">
                  Resistance levels
                </Text>
                {analysis.summary.resistanceLevels.map((level, i) => (
                  <Text key={i} variant="mono" className="text-bearish">
                    {formatPrice(level, quote?.currency)}
                  </Text>
                ))}
              </Surface>
            ) : null}
            {analysis?.summary.recentPatterns.length ? (
              <Surface>
                <Text variant="label" className="mb-2">
                  Recent patterns
                </Text>
                {analysis.summary.recentPatterns.map((pattern, i) => (
                  <Text key={i} variant="body-sm" className="capitalize">
                    {pattern}
                  </Text>
                ))}
              </Surface>
            ) : null}

            <Text variant="h3" headingLevel={3}>
              Evidence debate
            </Text>
            {debateQuery.isLoading && !debateQuery.debate ? (
              <View className="gap-3">
                <Skeleton height={120} rounded="lg" />
                <Skeleton height={160} rounded="lg" />
              </View>
            ) : null}
            {debateQuery.debate ? <AiDebateCard debate={debateQuery.debate} /> : null}
            {!debateQuery.isLoading && !debateQuery.debate ? (
              <Surface>
                <Text variant="h3" headingLevel={3}>
                  Debate unavailable
                </Text>
                <Text variant="body-sm" className="mt-2 text-text-secondary">
                  We could not assemble enough evidence for a balanced debate. Check market-data
                  connectivity and try again — we will not invent bull or bear points.
                </Text>
                <Button
                  className="mt-3 self-start"
                  size="sm"
                  variant="outline"
                  onPress={() => void debateQuery.refetch()}
                >
                  Retry debate
                </Button>
              </Surface>
            ) : null}
          </View>
        ) : null}
      </View>

      <AddToWatchlistSheet
        visible={watchlistSheetVisible}
        symbol={symbol}
        onClose={() => setWatchlistSheetVisible(false)}
      />
    </ScreenScaffold>
  );
}
