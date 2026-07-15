import { Pressable, View } from 'react-native';

import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import type { Asset, Quote } from '@/shared/types/market';
import { formatPercent, formatPrice, formatVolume, getPriceColorClass } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

import { useMarketQuote } from '../hooks/useMarketQuote';

interface QuoteRowProps {
  asset: Asset;
  quote?: Quote;
  onPress?: (asset: Asset) => void;
  showVolume?: boolean;
  className?: string;
}

export function QuoteRow({
  asset,
  quote: quoteProp,
  onPress,
  showVolume = false,
  className,
}: QuoteRowProps) {
  const { data: fetchedQuote, isLoading } = useMarketQuote({
    symbol: asset.symbol,
    marketType: asset.marketType,
    enabled: !quoteProp,
  });

  const quote = quoteProp ?? fetchedQuote;
  const changeClass = quote ? getPriceColorClass(quote.change) : 'text-text-secondary';

  const content = (
    <View className={cn('flex-row items-center border-b border-border py-3', className)}>
      <View className="flex-1">
        <Text variant="body" className="font-semibold">
          {asset.symbol}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {asset.name}
        </Text>
      </View>

      {showVolume && quote ? (
        <View className="mr-4 items-end">
          <Text variant="caption">Vol</Text>
          <Text variant="mono" className="text-xs">
            {formatVolume(quote.volume)}
          </Text>
        </View>
      ) : null}

      <View className="min-w-[80px] items-end">
        {isLoading && !quote ? (
          <Skeleton width={64} height={18} />
        ) : quote ? (
          <>
            <Text variant="mono" className="font-semibold">
              {formatPrice(quote.price, quote.currency)}
            </Text>
            <Text variant="caption" className={changeClass}>
              {formatPercent(quote.changePercent)}
            </Text>
          </>
        ) : (
          <Text variant="caption">—</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={() => onPress(asset)} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}
