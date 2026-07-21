import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { FearGreedGauge } from '@/features/markets/components/FearGreedGauge';
import { MarketHeatmap } from '@/features/markets/components/MarketHeatmap';
import { MarketSearchBar } from '@/features/markets/components/MarketSearchBar';
import { QuoteRow } from '@/features/markets/components/QuoteRow';
import { useLiveQuotes } from '@/features/markets/hooks/useLiveQuotes';
import type { LiveQuote } from '@/features/markets/constants/freshness';
import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import type { SearchResult } from '@/features/markets/services/market-search.service';
import { WatchlistCard } from '@/features/watchlists/components/WatchlistCard';
import { useWatchlists } from '@/features/watchlists/hooks/useWatchlists';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { POPULAR_SYMBOLS } from '@/shared/constants/markets';
import type { MarketType } from '@/shared/types/market';

const MARKET_TABS: { label: string; type: MarketType }[] = [
  { label: 'Stocks', type: 'stocks' },
  { label: 'Crypto', type: 'crypto' },
  { label: 'Forex', type: 'forex' },
  { label: 'Indices', type: 'indices' },
];

export default function MarketsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MarketType>('stocks');
  const [showOverview, setShowOverview] = useState(false);
  const { watchlists, isLoading: watchlistsLoading } = useWatchlists();

  const handleSelectAsset = useCallback(
    (result: SearchResult) => {
      router.push({
        pathname: '/asset/[symbol]',
        params: { symbol: result.symbol, marketType: result.marketType },
      });
    },
    [router],
  );

  const handleSymbolPress = useCallback(
    (symbol: string) => {
      router.push({
        pathname: '/asset/[symbol]',
        params: { symbol, marketType: activeTab },
      });
    },
    [router, activeTab],
  );

  const popularAssets = POPULAR_SYMBOLS[activeTab].map((symbol) =>
    buildAssetFromSymbol(symbol, activeTab),
  );
  const popularSymbols = popularAssets.slice(0, 6).map((a) => a.symbol);
  const livePopular = useLiveQuotes(popularSymbols);
  const quoteBySymbol = useMemo(() => {
    const map = new Map<string, LiveQuote>();
    for (const quote of livePopular.data ?? []) {
      map.set(quote.symbol.toUpperCase(), quote);
    }
    return map;
  }, [livePopular.data]);

  return (
    <Screen scrollable safeTop={false}>
      <Header
        title="Markets"
        subtitle="Find a symbol, then open the chart"
        rightAction={<DataFreshnessBadge fetchedAt={livePopular.dataUpdatedAt || undefined} />}
      />

      <View className="py-4">
        <MarketSearchBar onSelect={handleSelectAsset} initialMarketType={activeTab} />
      </View>

      <View className="mb-5">
        <Text variant="h3" className="mb-1">
          Your watchlists
        </Text>
        <Text variant="caption" className="mb-3 text-text-secondary">
          Start here if you already have names you follow
        </Text>
        {watchlistsLoading ? (
          <Skeleton height={100} rounded="lg" />
        ) : watchlists.length > 0 ? (
          <View className="gap-3">
            {watchlists.map((list) => (
              <WatchlistCard key={list.id} watchlist={list} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No watchlists yet"
            description="Search a symbol, open it, then tap + Watch."
          />
        )}
      </View>

      <View className="mb-4 flex-row gap-2" accessibilityRole="tablist">
        {MARKET_TABS.map((tab) => (
          <Pressable
            key={tab.type}
            onPress={() => setActiveTab(tab.type)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.type }}
            accessibilityLabel={`${tab.label} market`}
            className={`min-h-11 flex-1 justify-center rounded-full py-2.5 ${
              activeTab === tab.type ? 'bg-accent-muted' : 'bg-surface'
            }`}
          >
            <Text
              variant="caption"
              className={`text-center font-semibold ${
                activeTab === tab.type ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-5">
        <Text variant="h3" className="mb-1">
          Popular {activeTab}
        </Text>
        <Text variant="caption" className="mb-3 text-text-secondary">
          Live quotes · tap any row for the chart
        </Text>
        <View className="gap-1">
          {popularAssets.slice(0, 6).map((asset) => (
            <QuoteRow
              key={asset.symbol}
              asset={asset}
              quote={quoteBySymbol.get(asset.symbol.toUpperCase())}
              onPress={() => handleSymbolPress(asset.symbol)}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => setShowOverview((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showOverview }}
        className="mb-3 min-h-11 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
      >
        <View>
          <Text variant="label">Market overview</Text>
          <Text variant="caption" className="text-text-secondary">
            Heatmap{activeTab === 'crypto' ? ' & Fear & Greed' : ''}
          </Text>
        </View>
        <Text variant="caption" className="text-accent">
          {showOverview ? 'Hide' : 'Show'}
        </Text>
      </Pressable>

      {showOverview ? (
        <View className="mb-8 gap-4">
          <MarketHeatmap
            symbols={popularSymbols}
            quotes={livePopular.data}
            isLoading={livePopular.isLoading}
            onPress={handleSymbolPress}
          />
          {activeTab === 'crypto' ? <FearGreedGauge /> : null}
        </View>
      ) : (
        <View className="mb-8" />
      )}
    </Screen>
  );
}
