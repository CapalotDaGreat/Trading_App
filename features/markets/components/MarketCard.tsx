import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { ASSET_CLASS_LABELS } from '@/shared/constants/markets';
import type { Asset, Quote } from '@/shared/types/market';
import { formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

import { useMarketQuote } from '../hooks/useMarketQuote';

interface MarketCardProps {
  asset: Asset;
  quote?: Quote;
  onPress?: (asset: Asset) => void;
  compact?: boolean;
  className?: string;
}

export function MarketCard({ asset, quote: quoteProp, onPress, compact = false, className }: MarketCardProps) {
  const { data: fetchedQuote, isLoading } = useMarketQuote({
    symbol: asset.symbol,
    marketType: asset.marketType,
    enabled: !quoteProp,
  });

  const quote = quoteProp ?? fetchedQuote;

  return (
    <Pressable onPress={() => onPress?.(asset)} accessibilityRole="button">
      <GlassCard className={cn(compact ? 'p-3' : 'p-4', className)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-3">
            {asset.logoUrl ? (
              <Image source={{ uri: asset.logoUrl }} className="h-10 w-10 rounded-full" />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-active">
                <Text variant="label" className="text-accent">
                  {asset.symbol.slice(0, 2)}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text variant="body" className="font-semibold" numberOfLines={1}>
                {asset.symbol}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {asset.name}
              </Text>
            </View>
          </View>

          <View className="items-end">
            {isLoading && !quote ? (
              <Skeleton width={72} height={20} />
            ) : quote ? (
              <>
                <Text variant="price" className={getPriceColorClass(quote.change)}>
                  {formatPrice(quote.price, quote.currency)}
                </Text>
                <Text variant="caption" className={getPriceColorClass(quote.change)}>
                  {formatPercent(quote.changePercent)}
                </Text>
              </>
            ) : (
              <Text variant="caption">—</Text>
            )}
          </View>
        </View>

        {!compact ? (
          <View className="mt-3 flex-row items-center gap-2">
            <Badge label={ASSET_CLASS_LABELS[asset.assetClass]} size="sm" variant="outline" />
            {asset.exchange ? <Badge label={asset.exchange} size="sm" /> : null}
          </View>
        ) : null}
      </GlassCard>
    </Pressable>
  );
}
