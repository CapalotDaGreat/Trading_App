import { View } from 'react-native';

import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton, SkeletonGroup } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import {
  levelToColor,
  levelToLabel,
  type SentimentAnalysis,
} from '../services/sentiment-analysis.service';

interface SentimentPanelProps {
  data?: SentimentAnalysis | null;
  isLoading?: boolean;
}

export function SentimentPanel({ data, isLoading }: SentimentPanelProps) {
  if (isLoading || !data) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={20} width="40%" className="mb-3" />
        <SkeletonGroup count={4} itemHeight={20} />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="h3">Sentiment</Text>
        <View className="flex-row items-center gap-2">
          <DataSourceBadge kind={data.source === 'mock' ? 'mock' : 'delayed'} />
          <Badge label={levelToLabel(data.overallLevel)} variant="accent" size="sm" />
        </View>
      </View>

      <View className="mb-4 items-center">
        <Text variant="price-lg" className={levelToColor(data.overallLevel)}>
          {data.overallScore}
        </Text>
        <Text variant="caption">Overall Sentiment Score</Text>
      </View>

      <View className="mb-3 gap-2">
        {data.sources.map((source) => (
          <View
            key={source.name}
            className="flex-row items-center justify-between rounded-lg bg-surface/30 px-3 py-2"
          >
            <Text variant="label">{source.name}</Text>
            <View className="flex-row items-center gap-2">
              <Text variant="mono" className={levelToColor(source.level)}>
                {source.score}
              </Text>
              {source.volume ? (
                <Text variant="caption">({source.volume.toLocaleString()})</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Text variant="body-sm" className="leading-relaxed">
        {data.summary}
      </Text>
    </GlassCard>
  );
}
