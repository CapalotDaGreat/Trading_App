import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { MARKET_TYPE_LIST } from '@/shared/constants/markets';
import type { MarketType } from '@/shared/types/market';
import { cn } from '@/shared/utils/cn';

import { useMarketSearch } from '../hooks/useMarketSearch';
import type { SearchResult } from '../services/market-search.service';

interface MarketSearchBarProps {
  onSelect: (result: SearchResult) => void;
  initialMarketType?: MarketType;
  placeholder?: string;
  className?: string;
}

export function MarketSearchBar({
  onSelect,
  initialMarketType,
  placeholder = 'Search stocks, crypto, forex...',
  className,
}: MarketSearchBarProps) {
  const [query, setQuery] = useState('');
  const [marketType, setMarketType] = useState<MarketType | undefined>(initialMarketType);

  const { data: results, isLoading, isFetching } = useMarketSearch({
    query,
    marketType,
    enabled: query.length >= 1,
  });

  const showResults = query.length >= 1;

  return (
    <View className={cn('w-full', className)}>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
      />

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setMarketType(undefined)}
          className={cn(
            'rounded-full px-3.5 py-1.5',
            !marketType ? 'bg-accent-muted' : 'bg-surface',
          )}
        >
          <Text variant="caption" className={!marketType ? 'text-accent' : 'text-text-secondary'}>
            All
          </Text>
        </Pressable>
        {MARKET_TYPE_LIST.slice(0, 4).map((market) => (
          <Pressable
            key={market.type}
            onPress={() => setMarketType(market.type)}
            className={cn(
              'rounded-full px-3.5 py-1.5',
              marketType === market.type ? 'bg-accent-muted' : 'bg-surface',
            )}
          >
            <Text
              variant="caption"
              className={marketType === market.type ? 'text-accent' : 'text-text-secondary'}
            >
              {market.shortLabel}
            </Text>
          </Pressable>
        ))}
      </View>

      {showResults ? (
        <View className="mt-3 max-h-64 overflow-hidden rounded-2xl bg-background-elevated">
          {isLoading || isFetching ? (
            <View className="gap-2 p-3">
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </View>
          ) : results?.length ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                  }}
                  className="px-4 py-3.5 active:bg-surface"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text variant="body" className="font-semibold">
                        {item.symbol}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <Text variant="caption" className="text-text-tertiary">
                      {item.marketType}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <View className="p-4">
              <Text variant="body-sm" className="text-center">
                No results found
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
