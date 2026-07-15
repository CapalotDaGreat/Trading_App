import { View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';
import { formatRelativeTime } from '@/shared/utils/date';

import type { MarketSummary } from '../services/dashboard.service';

interface MarketSummaryCardProps {
  data?: MarketSummary;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<MarketSummary['marketStatus'], string> = {
  open: 'Market Open',
  closed: 'Market Closed',
  pre: 'Pre-Market',
  post: 'After Hours',
};

const STATUS_VARIANTS: Record<MarketSummary['marketStatus'], 'success' | 'default' | 'warning'> = {
  open: 'success',
  closed: 'default',
  pre: 'warning',
  post: 'warning',
};

export function MarketSummaryCard({ data, isLoading }: MarketSummaryCardProps) {
  if (isLoading || !data) {
    return (
      <GlassCard className="p-4" glow>
        <Skeleton height={20} width="40%" className="mb-3" />
        <View className="gap-3">
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4" glow>
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="h3">Market Overview</Text>
        <Badge
          label={STATUS_LABELS[data.marketStatus]}
          variant={STATUS_VARIANTS[data.marketStatus]}
          size="sm"
        />
      </View>

      <View className="gap-2">
        {data.indices.map((index) => (
          <View
            key={index.symbol}
            className="flex-row items-center justify-between rounded-xl bg-surface/50 px-3 py-2.5"
          >
            <View className="flex-1">
              <Text variant="label">{index.name}</Text>
              <Text variant="caption">{index.symbol}</Text>
            </View>
            <View className="items-end">
              <Text variant="price" className="text-base">
                {formatPrice(index.price)}
              </Text>
              <Text variant="mono" className={getPriceColorClass(index.changePercent)}>
                {formatChange(index.change, index.changePercent)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text variant="caption" className="mt-3 text-right">
        Updated {formatRelativeTime(data.lastUpdated)}
      </Text>
    </GlassCard>
  );
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${formatPercent(changePercent)})`;
}
