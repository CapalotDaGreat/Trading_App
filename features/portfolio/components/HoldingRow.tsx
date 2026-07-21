import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import {
  formatChange,
  formatPercent,
  formatPrice,
  getPriceColorClass,
} from '@/shared/utils/format';

import type { Holding, HoldingPnL } from '../types/portfolio.types';

interface HoldingRowProps {
  holding: Holding;
  pnl: HoldingPnL;
  onPress?: (holding: Holding) => void;
  onLongPress?: (holding: Holding) => void;
}

function HoldingRowComponent({ holding, pnl, onPress, onLongPress }: HoldingRowProps) {
  const pnlColor = getPriceColorClass(pnl.unrealizedPnL);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${holding.symbol}, ${formatPrice(holding.currentPrice, holding.currency)}, P and L ${formatPercent(pnl.unrealizedPnLPercent)}`}
      onPress={() => onPress?.(holding)}
      onLongPress={() => onLongPress?.(holding)}
      className="min-h-11"
    >
      <GlassCard className="mb-2 p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text variant="h3">{holding.symbol}</Text>
              {holding.side === 'short' ? <Badge label="Short" variant="danger" /> : null}
            </View>
            <Text variant="caption" numberOfLines={1}>
              {holding.name}
            </Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              {holding.quantity} @ {formatPrice(holding.averageCost, holding.currency)}
            </Text>
          </View>

          <View className="items-end">
            <Text variant="price">{formatPrice(holding.currentPrice, holding.currency)}</Text>
            <Text variant="caption" className={pnlColor}>
              {formatChange(pnl.unrealizedPnL, holding.currency)} (
              {formatPercent(pnl.unrealizedPnLPercent)})
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              {formatPrice(pnl.marketValue, holding.currency, { compact: true })}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export const HoldingRow = memo(HoldingRowComponent);
