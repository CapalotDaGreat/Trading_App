import { Pressable, View } from 'react-native';

import { buildAssetFromSymbol } from '@/features/markets/services/market-data.service';
import { QuoteRow } from '@/features/markets/components/QuoteRow';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { IconButton } from '@/shared/components/ui/IconButton';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type { Watchlist } from '../services/watchlist.service';

interface WatchlistCardProps {
  watchlist: Watchlist;
  onPress?: (watchlist: Watchlist) => void;
  onDelete?: (watchlist: Watchlist) => void;
  maxPreview?: number;
  className?: string;
}

export function WatchlistCard({
  watchlist,
  onPress,
  onDelete,
  maxPreview = 3,
  className,
}: WatchlistCardProps) {
  const previewSymbols = watchlist.symbols.slice(0, maxPreview);

  return (
    <GlassCard className={cn('p-4', className)}>
      <Pressable onPress={() => onPress?.(watchlist)} accessibilityRole="button">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text variant="h3" numberOfLines={1}>
              {watchlist.name}
            </Text>
            <Text variant="caption">
              {watchlist.symbols.length} symbol{watchlist.symbols.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Badge label={`${watchlist.symbols.length}`} variant="accent" size="sm" />
            {onDelete ? (
              <IconButton
                icon={<Text className="text-bearish">×</Text>}
                variant="ghost"
                size="sm"
                onPress={() => onDelete(watchlist)}
                accessibilityLabel="Delete watchlist"
              />
            ) : null}
          </View>
        </View>
      </Pressable>

      {previewSymbols.length > 0 ? (
        <View>
          {previewSymbols.map((symbol) => {
            const asset = buildAssetFromSymbol(symbol);
            return <QuoteRow key={symbol} asset={asset} />;
          })}
          {watchlist.symbols.length > maxPreview ? (
            <Text variant="caption" className="mt-1 text-center text-text-tertiary">
              +{watchlist.symbols.length - maxPreview} more
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="body-sm" className="text-center text-text-tertiary">
          No symbols yet
        </Text>
      )}
    </GlassCard>
  );
}
