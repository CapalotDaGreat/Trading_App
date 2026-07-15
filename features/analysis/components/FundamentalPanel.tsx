import { View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton, SkeletonGroup } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatMarketCap, formatNumber } from '@/shared/utils/format';

import {
  ratingToColor,
  type FundamentalAnalysis,
} from '../services/fundamental-analysis.service';

interface FundamentalPanelProps {
  data?: FundamentalAnalysis | null;
  isLoading?: boolean;
}

export function FundamentalPanel({ data, isLoading }: FundamentalPanelProps) {
  if (isLoading || !data) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="50%" className="mb-3" />
        <SkeletonGroup count={6} itemHeight={20} />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <View className="mb-1">
        <Text variant="h3">{data.companyName}</Text>
        <Text variant="caption">
          {data.sector} · {data.industry}
        </Text>
      </View>

      <View className="mb-3 mt-2 flex-row gap-2">
        <Badge label={data.valuation} variant="accent" size="sm" />
        <Badge label={`Growth: ${data.growth}`} variant="default" size="sm" />
        <Badge label={data.profitability} variant="success" size="sm" />
      </View>

      <Text variant="caption" className="mb-3">
        Market Cap: {formatMarketCap(data.marketCap)}
      </Text>

      <View className="gap-1.5">
        {data.metrics.map((metric) => (
          <View
            key={metric.label}
            className="flex-row items-center justify-between rounded-lg bg-surface/30 px-3 py-2"
          >
            <Text variant="label">{metric.label}</Text>
            <View className="items-end">
              <Text variant="mono" className={ratingToColor(metric.rating)}>
                {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
              </Text>
              {metric.benchmark ? (
                <Text variant="caption">vs {metric.benchmark}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Text variant="body-sm" className="mt-3 leading-relaxed">
        {data.summary}
      </Text>
    </GlassCard>
  );
}
