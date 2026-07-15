import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

import type { WatchlistHighlight } from '../services/dashboard.service';

interface WatchlistPreviewProps {
  items?: WatchlistHighlight[];
  isLoading?: boolean;
}

export function WatchlistPreview({ items, isLoading }: WatchlistPreviewProps) {
  const router = useRouter();

  if (isLoading || !items) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="50%" className="mb-3" />
        <View className="gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="h3">Watchlist</Text>
        <Pressable onPress={() => router.push('/watchlist' as never)}>
          <Text variant="label" className="text-accent">
            See all
          </Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text variant="body-sm" className="py-4 text-center">
          Add symbols to your watchlist to track them here.
        </Text>
      ) : (
        <View className="gap-1">
          {items.map((item) => (
            <Pressable
              key={item.symbol}
              onPress={() => router.push(`/analysis/${item.symbol}` as never)}
              className="flex-row items-center justify-between rounded-xl px-2 py-2.5 active:bg-surface-hover"
            >
              <View className="flex-1">
                <Text variant="label">{item.symbol}</Text>
                <Text variant="caption" numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <View className="items-end">
                <Text variant="mono" className="font-semibold">
                  {formatPrice(item.price, item.currency)}
                </Text>
                <Text variant="caption" className={getPriceColorClass(item.changePercent)}>
                  {formatPercent(item.changePercent)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
