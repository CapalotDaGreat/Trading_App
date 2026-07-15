import { View } from 'react-native';

import { AiExplainButton } from '@/features/ai/components/AiExplainButton';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton, SkeletonGroup } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatNumber, formatPrice } from '@/shared/utils/format';

import {
  signalToColor,
  signalToLabel,
  type TechnicalAnalysis,
} from '../services/technical-analysis.service';

interface TechnicalAnalysisPanelProps {
  symbol: string;
  data?: TechnicalAnalysis | null;
  isLoading?: boolean;
}

export function TechnicalAnalysisPanel({ symbol, data, isLoading }: TechnicalAnalysisPanelProps) {
  if (isLoading || !data) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="50%" className="mb-3" />
        <SkeletonGroup count={5} itemHeight={20} />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="h3">Technical</Text>
        <View className="flex-row items-center gap-2">
          <AiExplainButton symbol={symbol} />
          <Badge label={signalToLabel(data.overallSignal)} variant="accent" size="sm" />
        </View>
      </View>

      <View className="mb-4 flex-row items-center justify-between rounded-xl bg-surface/30 px-4 py-3">
        <View>
          <Text variant="caption">Trend</Text>
          <Text variant="label" className="capitalize">
            {data.trend}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="caption">Score</Text>
          <Text variant="price" className={signalToColor(data.overallSignal)}>
            {data.score}/100
          </Text>
        </View>
      </View>

      <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide">
        Indicators
      </Text>
      <View className="mb-3 gap-1.5">
        {data.indicators.map((indicator) => (
          <View
            key={indicator.name}
            className="flex-row items-center justify-between rounded-lg bg-surface/30 px-3 py-2"
          >
            <View className="flex-1">
              <Text variant="label">{indicator.name}</Text>
              <Text variant="caption" numberOfLines={1}>
                {indicator.description}
              </Text>
            </View>
            <View className="items-end">
              <Text variant="mono" className={signalToColor(indicator.signal)}>
                {formatNumber(indicator.value, 2)}
              </Text>
              <Text variant="caption" className={signalToColor(indicator.signal)}>
                {signalToLabel(indicator.signal)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide">
        Key Levels
      </Text>
      <View className="gap-1.5">
        {data.supportResistance.map((level, i) => (
          <View
            key={`${level.type}-${i}`}
            className="flex-row items-center justify-between rounded-lg bg-surface/30 px-3 py-2"
          >
            <Text variant="label" className="capitalize">
              {level.type} ({level.strength})
            </Text>
            <Text variant="mono">{formatPrice(level.level)}</Text>
          </View>
        ))}
      </View>

      <Text variant="body-sm" className="mt-3 leading-relaxed">
        {data.summary}
      </Text>
    </GlassCard>
  );
}
