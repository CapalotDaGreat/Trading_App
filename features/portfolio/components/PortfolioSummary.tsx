import { View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatChange, formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

import type { PortfolioSummary as PortfolioSummaryType } from '../types/portfolio.types';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const pnlColor = getPriceColorClass(summary.totalPnL);
  const dayColor = getPriceColorClass(summary.dayChange);

  return (
    <GlassCard className="p-4" glow>
      <Text variant="label" className="mb-1">
        Total Portfolio Value
      </Text>
      <Text variant="price-lg" className="mb-4">
        {formatPrice(summary.totalValue, summary.currency)}
      </Text>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text variant="caption" className="mb-0.5">
            Total P&L
          </Text>
          <Text variant="price" className={pnlColor}>
            {formatChange(summary.totalPnL, summary.currency)}
          </Text>
          <Text variant="caption" className={pnlColor}>
            {formatPercent(summary.totalPnLPercent)}
          </Text>
        </View>

        <View className="flex-1">
          <Text variant="caption" className="mb-0.5">
            Today
          </Text>
          <Text variant="price" className={dayColor}>
            {formatChange(summary.dayChange, summary.currency)}
          </Text>
          <Text variant="caption" className={dayColor}>
            {formatPercent(summary.dayChangePercent)}
          </Text>
        </View>

        <View className="flex-1">
          <Text variant="caption" className="mb-0.5">
            Holdings
          </Text>
          <Text variant="price">{summary.holdingsCount}</Text>
          <Text variant="caption" className="text-text-tertiary">
            Cost {formatPrice(summary.totalCost, summary.currency, { compact: true })}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}
