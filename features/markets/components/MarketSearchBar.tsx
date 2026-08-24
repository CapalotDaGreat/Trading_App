import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Input } from '@/shared/components/ui/Input';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { MARKET_TYPE_LIST } from '@/shared/constants/markets';
import type { MarketType } from '@/shared/types/market';
import { cn } from '@/shared/utils/cn';

import { useInstrumentSearch } from '../hooks/useInstrumentSearch';
import { instrumentToAsset } from '../services/instrument-identity.service';
import type { SearchResult } from '../services/market-search.service';
import {
  INSTRUMENT_RESOLUTION_COPY,
  instrumentClassLabel,
} from '../types/instrument.types';

interface MarketSearchBarProps {
  onSelect: (result: SearchResult) => void;
  initialMarketType?: MarketType;
  placeholder?: string;
  className?: string;
}

export function MarketSearchBar({
  onSelect,
  initialMarketType,
  placeholder = 'Search stocks, crypto, forex, metals…',
  className,
}: MarketSearchBarProps) {
  const [query, setQuery] = useState('');
  const [marketType, setMarketType] = useState<MarketType | undefined>(initialMarketType);

  const search = useInstrumentSearch({
    query,
    enabled: query.trim().length >= 1,
  });

  const results = useMemo((): SearchResult[] => {
    const hits = search.data ?? [];
    return hits
      .filter((hit) => !marketType || hit.instrument.marketType === marketType)
      .map((hit) => ({
        ...instrumentToAsset(hit.instrument),
        relevance: hit.rankScore,
      }));
  }, [search.data, marketType]);

  const showResults = query.trim().length >= 1;

  return (
    <View className={cn('w-full', className)}>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search markets by name or symbol"
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
          {search.isLoading || search.isFetching ? (
            <View className="gap-2 p-3">
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </View>
          ) : results.length ? (
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
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.symbol}, ${instrumentClassLabel(item.assetClass)}`}
                  className="px-4 py-3.5 active:bg-surface"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text variant="body" className="font-semibold">
                        {item.name}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {item.symbol}
                        {item.exchange ? ` · ${item.exchange}` : ''}
                      </Text>
                    </View>
                    <Text variant="caption" className="text-text-tertiary">
                      {instrumentClassLabel(item.assetClass)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <View className="p-4">
              <Text variant="body-sm" className="text-center">
                {INSTRUMENT_RESOLUTION_COPY.couldNotVerify}
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}
