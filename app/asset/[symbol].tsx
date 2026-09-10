import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { IndicatorPanel } from '@/features/charts/components/IndicatorPanel';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { useChartData } from '@/features/charts/hooks/useChartData';
import type { IndicatorType } from '@/features/charts/utils/indicators';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { useMarketQuote } from '@/features/markets/hooks/useMarketQuote';
import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import {
  INSTRUMENT_CLASS_DISPLAY,
  INSTRUMENT_RESOLUTION_COPY,
  isUsableMarketPrice,
} from '@/features/markets/types/instrument.types';
import { AssetStudyNextSteps } from '@/features/research/components/AssetStudyNextSteps';
import { LearnFromChartSection } from '@/features/research/components/LearnFromChartSection';
import {
  STUDY_CONCEPTS,
  describeStudyProvenance,
  educationalRsiReading,
  findStudyReplayEpisodes,
  studyDrillsForConcepts,
  type StudyConcept,
} from '@/features/research/services/asset-study.service';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { AddToWatchlistSheet } from '@/features/watchlists/components/AddToWatchlistSheet';
import { AccessibleChartFrame } from '@/shared/components/charts/AccessibleChartFrame';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Badge } from '@/shared/components/ui/Badge';
import { Surface } from '@/shared/components/ui/Surface';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval, MarketType } from '@/shared/types/market';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { composeChartSpokenSummary, spokenIntervalLabel } from '@/shared/utils/accessibility';
import { formatPrice, formatVolume } from '@/shared/utils/format';

export default function AssetStudyScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const params = useLocalSearchParams<{
    symbol: string;
    marketType?: string;
    tab?: string;
    from?: string;
  }>();
  const symbol = decodeURIComponent(params.symbol ?? '');
  const marketType = (params.marketType as MarketType) ?? undefined;
  const fromSimulation = params.from === 'simulate';

  const [interval, setInterval] = useState<CandleInterval>('1d');
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(['rsi', 'macd']);
  const [studyListVisible, setStudyListVisible] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<StudyConcept>(STUDY_CONCEPTS[0]);

  const asset = useMemo(() => buildAssetFromSymbol(symbol, marketType), [symbol, marketType]);
  const { account } = useSimulation();
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
    enabled: true,
  });

  const provenance = describeStudyProvenance({
    kind: chartSource?.kind ?? quote?.dataSourceKind,
    provider: chartSource?.provider,
  });
  const rsiReading = educationalRsiReading(analysis?.indicators.rsi);
  const replayEpisodes = useMemo(() => findStudyReplayEpisodes(asset.symbol), [asset.symbol]);
  const drills = useMemo(
    () => studyDrillsForConcepts([selectedConcept, ...STUDY_CONCEPTS]),
    [selectedConcept],
  );
  const classLabel = INSTRUMENT_CLASS_DISPLAY[asset.assetClass] ?? asset.marketType;

  const toggleIndicator = useCallback((indicator: IndicatorType) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator],
    );
  }, []);

  return (
    <ScreenScaffold
      eyebrow="Study an asset"
      title={`Study ${asset.symbol}`}
      subtitle="What can I learn by studying this asset? Not whether to trade it."
      showBack
      onBack={fromSimulation ? () => router.back() : undefined}
      contentClassName="pb-10"
      testID="asset-detail-screen"
    >
      <View className="gap-4">
        <Surface padding="sm" testID="asset-identity">
          <Text variant="h3" headingLevel={3}>
            {asset.name}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            {classLabel}
            {asset.exchange ? ` · ${asset.exchange}` : ''}
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Badge label={provenance.kindLabel} size="sm" variant="outline" />
            <Badge label={provenance.sourceLabel} size="sm" variant="outline" />
            {quote?.dataSourceKind ? <DataSourceBadge kind={quote.dataSourceKind} /> : null}
            <DataFreshnessBadge fetchedAt={quote?.fetchedAt ?? dataUpdatedAt} />
          </View>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            {provenance.detail}
          </Text>
        </Surface>

        {quoteLoading ? (
          <Skeleton height={40} />
        ) : quote && isUsableMarketPrice(quote.price) ? (
          <Surface padding="sm" tone="subtle" testID="asset-price-provenance">
            <Text variant="caption" className="text-text-tertiary">
              Last print · study context · {provenance.kindLabel}
            </Text>
            <Text variant="body" className="mt-1">
              {formatPrice(quote.price, quote.currency)}
            </Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Open {formatPrice(quote.open, quote.currency)} · High{' '}
              {formatPrice(quote.high, quote.currency)} · Low {formatPrice(quote.low, quote.currency)}{' '}
              · Vol {formatVolume(quote.volume)}
            </Text>
          </Surface>
        ) : (
          <Surface padding="sm" tone="subtle" testID="asset-price-unavailable">
            <Text variant="body">{INSTRUMENT_RESOLUTION_COPY.priceUnavailable}</Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              The chart below can still be used as a study specimen.
            </Text>
          </Surface>
        )}

        <View testID="asset-chart-panel">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Educational chart
          </Text>
          <TimeframeSelector value={interval} onChange={setInterval} />
          <AccessibleChartFrame
            title={`${asset.symbol} educational chart`}
            timeRange={spokenIntervalLabel(interval) ?? interval}
            source={
              chartSource
                ? `${provenance.kindLabel} · ${chartSource.provider}`
                : provenance.sourceLabel
            }
            freshness={
              chartSource
                ? `Fetched ${new Date(chartSource.fetchedAt).toLocaleTimeString()}`
                : 'Freshness unknown'
            }
            summary={composeChartSpokenSummary({
              symbol: asset.symbol,
              candles,
              intervalLabel: spokenIntervalLabel(interval),
              dataKind: chartSource?.kind,
            })}
            textualAlternative={composeChartSpokenSummary({
              symbol: asset.symbol,
              candles,
              intervalLabel: spokenIntervalLabel(interval),
              dataKind: chartSource?.kind,
            })}
          >
            <Surface padding="sm" className="mt-2 overflow-hidden">
              <CandlestickChart
                candles={candles}
                isLoading={chartLoading}
                currency={quote?.currency}
                height={layout.isLandscape ? 360 : 300}
                symbol={asset.symbol}
                intervalLabel={spokenIntervalLabel(interval)}
                dataKind={chartSource?.kind}
                accessible={false}
              />
            </Surface>
          </AccessibleChartFrame>

          {rsiReading ? (
            <Surface padding="sm" tone="subtle" className="mt-3" testID="asset-rsi-reading">
              <Text variant="label">RSI: {rsiReading.value}</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {rsiReading.lessonHint}
              </Text>
            </Surface>
          ) : null}

          <CollapsibleSection
            title="Indicator overlays"
            description="Readings on labelled data. They describe the recent tape — they do not tell you what to buy."
            defaultExpanded={false}
          >
            <IndicatorPanel active={activeIndicators} onToggle={toggleIndicator} />
          </CollapsibleSection>
        </View>

        <LearnFromChartSection symbol={asset.symbol} onSelectConcept={setSelectedConcept} />

        <AssetStudyNextSteps
          symbol={asset.symbol}
          drills={drills}
          replayEpisodes={replayEpisodes}
          fromSimulation={fromSimulation}
          hasSimulationAccount={Boolean(account)}
          onSaveStudyList={() => setStudyListVisible(true)}
        />
      </View>

      <AddToWatchlistSheet
        visible={studyListVisible}
        symbol={symbol}
        onClose={() => setStudyListVisible(false)}
      />
    </ScreenScaffold>
  );
}
