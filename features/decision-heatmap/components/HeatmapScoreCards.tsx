import { View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { HeatmapScores } from '../types/heatmap.types';

function trendLabel(trend: HeatmapScores['improvementTrend'], delta: number): string {
  if (trend === 'improving') return `Improving (+${delta})`;
  if (trend === 'slipping') return `Needs attention (${delta})`;
  return `Steady (${delta >= 0 ? '+' : ''}${delta})`;
}

interface HeatmapScoreCardsProps {
  scores: HeatmapScores;
}

export function HeatmapScoreCards({ scores }: HeatmapScoreCardsProps) {
  const items = [
    { label: 'Consistency', value: scores.consistencyScore },
    { label: 'Learning', value: scores.learningScore },
    { label: 'Discipline', value: scores.disciplineScore },
  ];

  return (
    <View className="gap-3" testID="decision-heatmap-scores">
      <View className="flex-row gap-2">
        {items.map((item) => (
          <GlassCard key={item.label} className="flex-1 p-3">
            <Text variant="caption" className="text-text-tertiary">
              {item.label}
            </Text>
            <Text variant="h3" className="mt-1">
              {item.value}
            </Text>
          </GlassCard>
        ))}
      </View>
      <GlassCard className="p-3" bordered>
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
          Improvement trend
        </Text>
        <Text variant="body" className="mt-1 text-text-primary">
          {trendLabel(scores.improvementTrend, scores.trendDelta)}
        </Text>
        <Text variant="caption" className="mt-1 text-text-secondary">
          Compares early vs late process intensity in this range — never P&L.
        </Text>
      </GlassCard>
    </View>
  );
}
