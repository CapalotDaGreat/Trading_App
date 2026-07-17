import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { IndicatorPanel } from '@/features/charts/components/IndicatorPanel';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { useChartData } from '@/features/charts/hooks/useChartData';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import { MtfConsensusCard } from '@/features/decision/components/MtfConsensusCard';
import { useMtfConsensus, useRegime } from '@/features/decision/hooks/useDecision';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { useMarketQuote } from '@/features/markets/hooks/useMarketQuote';
import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import { AddToWatchlistSheet } from '@/features/watchlists/components/AddToWatchlistSheet';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval, MarketType } from '@/shared/types/market';
import {
  formatChange,
  formatPercent,
  formatPrice,
  formatVolume,
  getPriceColorClass,
} from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

import type { IndicatorType } from '@/features/charts/utils/indicators';

type DetailTab = 'decision' | 'chart' | 'indicators' | 'analysis';

export default function AssetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol: string; marketType?: string }>();
  const symbol = decodeURIComponent(params.symbol ?? '');
  const marketType = (params.marketType as MarketType) ?? undefined;

  const [interval, setInterval] = useState<CandleInterval>('1d');
  const [activeTab, setActiveTab] = useState<DetailTab>('decision');
  const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>([
    'rsi',
    'macd',
    'bollinger',
  ]);
  const [watchlistSheetVisible, setWatchlistSheetVisible] = useState(false);

  const asset = useMemo(() => buildAssetFromSymbol(symbol, marketType), [symbol, marketType]);

  const { data: quote, isLoading: quoteLoading } = useMarketQuote({
    symbol,
    marketType: asset.marketType,
  });

  const { candles, analysis, isLoading: chartLoading, dataUpdatedAt } = useChartData({
    symbol,
    interval,
    marketType: asset.marketType,
    indicators: activeIndicators,
  });
  const mtfQuery = useMtfConsensus(symbol);
  const regimeQuery = useRegime();
  const appendDecision = useAppendDecisionRecord();
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!symbol || !regimeQuery.data || loggedRef.current) return;
    loggedRef.current = true;
    void appendDecision.mutateAsync({
      symbol,
      regime: regimeQuery.data.label,
      action: 'opened',
      bias: analysis?.summary.overallBias,
      note: 'Asset decision tab opened',
    });
  }, [symbol, regimeQuery.data, analysis?.summary.overallBias, appendDecision]);

  const toggleIndicator = useCallback((indicator: IndicatorType) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator) ? prev.filter((i) => i !== indicator) : [...prev, indicator],
    );
  }, []);

  const changeClass = quote ? getPriceColorClass(quote.change) : 'text-text-secondary';

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'decision', label: 'Decision' },
    { key: 'chart', label: 'Chart' },
    { key: 'indicators', label: 'Indicators' },
    { key: 'analysis', label: 'Analysis' },
  ];

  return (
    <Screen scrollable safeTop={false}>
      <Header
        title={asset.symbol}
        subtitle={asset.name}
        onBack={() => router.back()}
        rightAction={
          <Button size="sm" variant="outline" onPress={() => setWatchlistSheetVisible(true)}>
            + Watch
          </Button>
        }
      />

      <View className="py-4">
        {quoteLoading ? (
          <Skeleton height={48} />
        ) : quote ? (
          <View>
            <Text variant="price-lg" className={changeClass}>
              {formatPrice(quote.price, quote.currency)}
            </Text>
            <View className="mt-1 flex-row items-center gap-3">
              <Text variant="body" className={changeClass}>
                {formatChange(quote.change, quote.currency)} ({formatPercent(quote.changePercent)})
              </Text>
              <Badge label={quote.status} size="sm" variant="outline" />
              <DataFreshnessBadge fetchedAt={quote.fetchedAt ?? dataUpdatedAt} />
            </View>
            {analysis ? (
              <EmbeddedAiInsight
                className="mt-3"
                title="Should this chart get your time?"
                confidence={Math.round(analysis.summary.confidence * 100)}
                body={`${analysis.summary.overallBias} bias · ${analysis.summary.trend} · RSI ${analysis.summary.rsiSignal}. Use invalidation levels before sizing any idea.`}
                onExplain={() => router.push(`/analysis/${encodeURIComponent(symbol)}` as never)}
              />
            ) : null}
            <View className="mt-3 flex-row flex-wrap gap-4">
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
          </View>
        ) : null}
      </View>

      <TimeframeSelector value={interval} onChange={setInterval} className="mb-4" />

      <View className="mb-4 flex-row rounded-2xl bg-surface p-1">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-lg py-2',
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

      {activeTab === 'decision' && analysis ? (
        <View className="mb-8 gap-4">
          {mtfQuery.data ? <MtfConsensusCard data={mtfQuery.data} /> : null}
          <GlassCard className="p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="h3">Bias & invalidation</Text>
              <Badge
                label={analysis.summary.overallBias}
                variant={
                  analysis.summary.overallBias === 'bullish'
                    ? 'success'
                    : analysis.summary.overallBias === 'bearish'
                      ? 'danger'
                      : 'default'
                }
              />
            </View>
            <Text variant="body-sm" className="text-text-secondary">
              {analysis.summary.trend} · {(analysis.summary.confidence * 100).toFixed(0)}% confidence
            </Text>
            {analysis.summary.supportLevels[0] ? (
              <Text variant="caption" className="mt-2 text-bearish">
                Invalidation (long): below {formatPrice(analysis.summary.supportLevels[0], quote?.currency)}
              </Text>
            ) : null}
            {analysis.summary.resistanceLevels[0] ? (
              <Text variant="caption" className="mt-1 text-bearish">
                Invalidation (short): above {formatPrice(analysis.summary.resistanceLevels[0], quote?.currency)}
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
          </GlassCard>
          <ExplainabilityBlock
            explainability={{
              confidence: Math.round(analysis.summary.confidence * 100),
              factors: [
                { label: 'Trend', agrees: true, detail: analysis.summary.trend },
                { label: 'RSI', agrees: analysis.summary.rsiSignal !== 'neutral', detail: analysis.summary.rsiSignal },
                { label: 'MACD', agrees: analysis.summary.macdSignal !== 'neutral', detail: analysis.summary.macdSignal },
              ],
              agrees: 2,
              disagrees: 1,
              dataAsOf: dataUpdatedAt ?? Date.now(),
              freshness: 'recent',
              reasoning: 'Decision tab summarizes whether this symbol deserves research time today.',
            }}
          />
        </View>
      ) : null}

      {activeTab === 'chart' ? (
        <GlassCard className="mb-6 overflow-hidden p-2">
          <View className="mb-2 flex-row justify-end px-1">
            <DataSourceBadge kind="live" />
          </View>
          <CandlestickChart
            candles={candles}
            isLoading={chartLoading}
            currency={quote?.currency}
            height={300}
          />
        </GlassCard>
      ) : null}

      {activeTab === 'indicators' ? (
        <View className="mb-6 gap-4">
          <IndicatorPanel active={activeIndicators} onToggle={toggleIndicator} />
          {analysis?.indicators.rsi ? (
            <GlassCard className="p-4">
              <Text variant="label" className="mb-2">
                RSI (14)
              </Text>
              <Text variant="price">
                {(
                  (analysis.indicators.rsi as { values: { value: number }[] }).values.slice(-1)[0]
                    ?.value ?? 0
                ).toFixed(2)}
              </Text>
            </GlassCard>
          ) : null}
          {analysis?.indicators.macd ? (
            <GlassCard className="p-4">
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
                    <Text variant="mono" className={macd.histogram >= 0 ? 'text-bullish' : 'text-bearish'}>
                      Histogram: {macd.histogram.toFixed(4)}
                    </Text>
                  </View>
                ) : null;
              })()}
            </GlassCard>
          ) : null}
        </View>
      ) : null}

      {activeTab === 'analysis' && analysis ? (
        <View className="mb-8 gap-4">
          {mtfQuery.data ? <MtfConsensusCard data={mtfQuery.data} /> : null}
          <GlassCard className="p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="h3">Overall Bias</Text>
              <Badge
                label={analysis.summary.overallBias}
                variant={
                  analysis.summary.overallBias === 'bullish'
                    ? 'success'
                    : analysis.summary.overallBias === 'bearish'
                      ? 'danger'
                      : 'default'
                }
              />
            </View>
            <Text variant="body-sm">
              Trend: {analysis.summary.trend} · Confidence:{' '}
              {(analysis.summary.confidence * 100).toFixed(0)}%
            </Text>
            <View className="mt-3 flex-row gap-3">
              <Badge label={`RSI: ${analysis.summary.rsiSignal}`} size="sm" />
              <Badge label={`MACD: ${analysis.summary.macdSignal}`} size="sm" />
            </View>
          </GlassCard>

          {analysis.summary.supportLevels.length > 0 ? (
            <GlassCard className="p-4">
              <Text variant="label" className="mb-2">
                Support Levels
              </Text>
              {analysis.summary.supportLevels.map((level, i) => (
                <Text key={i} variant="mono" className="text-bullish">
                  {formatPrice(level, quote?.currency)}
                </Text>
              ))}
            </GlassCard>
          ) : null}

          {analysis.summary.resistanceLevels.length > 0 ? (
            <GlassCard className="p-4">
              <Text variant="label" className="mb-2">
                Resistance Levels
              </Text>
              {analysis.summary.resistanceLevels.map((level, i) => (
                <Text key={i} variant="mono" className="text-bearish">
                  {formatPrice(level, quote?.currency)}
                </Text>
              ))}
            </GlassCard>
          ) : null}

          {analysis.summary.recentPatterns.length > 0 ? (
            <GlassCard className="p-4">
              <Text variant="label" className="mb-2">
                Recent Patterns
              </Text>
              {analysis.summary.recentPatterns.map((pattern, i) => (
                <Text key={i} variant="body-sm" className="capitalize">
                  {pattern}
                </Text>
              ))}
            </GlassCard>
          ) : null}
        </View>
      ) : null}

      <AddToWatchlistSheet
        visible={watchlistSheetVisible}
        symbol={symbol}
        onClose={() => setWatchlistSheetVisible(false)}
      />
    </Screen>
  );
}
