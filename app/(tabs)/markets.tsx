import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { FearGreedGauge } from '@/features/markets/components/FearGreedGauge';
import { MarketCard } from '@/features/markets/components/MarketCard';
import { MarketHeatmap } from '@/features/markets/components/MarketHeatmap';
import { MarketSearchBar } from '@/features/markets/components/MarketSearchBar';
import { QuoteRow } from '@/features/markets/components/QuoteRow';
import { useLiveQuotes } from '@/features/markets/hooks/useLiveQuotes';
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
  const popularSymbols = popularAssets.slice(0, 5).map((a) => a.symbol);
  const livePopular = useLiveQuotes(popularSymbols);

  return (
    <Screen scrollable safeTop={false}>
      <Header
        title="Markets"
        subtitle="Live quotes"
        rightAction={<DataFreshnessBadge fetchedAt={livePopular.dataUpdatedAt || undefined} />}
      />

      <View className="py-4">
        <MarketSearchBar onSelect={handleSelectAsset} initialMarketType={activeTab} />
      </View>

      <View className="mb-4 flex-row gap-2">
        {MARKET_TABS.map((tab) => (
          <Pressable
            key={tab.type}
            onPress={() => setActiveTab(tab.type)}
            className={`flex-1 rounded-xl border py-2.5 ${
              activeTab === tab.type
                ? 'border-border-strong bg-background-elevated'
                : 'border-border bg-surface'
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

      <View className="mb-6">
        <Text variant="h3" className="mb-3">
          Popular {activeTab}
        </Text>
        <View className="gap-2">
          {popularAssets.slice(0, 5).map((asset) => (
            <QuoteRow key={asset.symbol} asset={asset} onPress={() => handleSymbolPress(asset.symbol)} />
          ))}
        </View>
      </View>

      <View className="mb-6">
        <MarketHeatmap
          symbols={POPULAR_SYMBOLS[activeTab].slice(0, 6)}
          onPress={handleSymbolPress}
        />
      </View>

      {activeTab === 'crypto' ? (
        <View className="mb-6">
          <FearGreedGauge />
        </View>
      ) : null}

      <View className="mb-6">
        <Text variant="h3" className="mb-3">
          Trending
        </Text>
        <View className="gap-3">
          {popularAssets.slice(0, 3).map((asset) => (
            <MarketCard
              key={asset.symbol}
              asset={asset}
              onPress={() => handleSymbolPress(asset.symbol)}
            />
          ))}
        </View>
      </View>

      <View className="mb-8">
        <Text variant="h3" className="mb-3">
          Your Watchlists
        </Text>
        {watchlistsLoading ? (
          <Skeleton height={120} rounded="lg" />
        ) : watchlists.length > 0 ? (
          <View className="gap-3">
            {watchlists.map((list) => (
              <WatchlistCard key={list.id} watchlist={list} />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No watchlists yet"
            description="Search for an asset and add it to a watchlist from the asset detail screen."
          />
        )}
      </View>
    </Screen>
  );
}
