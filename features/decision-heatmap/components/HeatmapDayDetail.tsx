import { View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import { heatmapLevelColorToken } from '../services/heatmap.service';
import type { HeatmapCell } from '../types/heatmap.types';

interface HeatmapDayDetailProps {
  cell: HeatmapCell;
}

export function HeatmapDayDetail({ cell }: HeatmapDayDetailProps) {
  const { activity } = cell;
  const level = heatmapLevelColorToken(cell.level);

  const rows = [
    { label: 'Journal completions', value: activity.journalCompletions },
    { label: 'Replay completions', value: activity.replayCompletions },
    { label: 'Checklist usage', value: activity.checklistUses },
    { label: 'Research sessions', value: activity.researchSessions },
    { label: 'Learning sessions', value: activity.learningSessions },
    { label: 'Academy progress events', value: activity.academyEvents },
  ];

  return (
    <GlassCard className="p-4" bordered testID="decision-heatmap-detail">
      <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
        {cell.label}
      </Text>
      <Text variant="h3" className="mt-1">
        {level.label}
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        Process intensity {cell.processIntensity}
        {activity.averageDecisionQuality != null
          ? ` · Avg Decision Quality ${Math.round(activity.averageDecisionQuality)}`
          : ''}
      </Text>

      <View className="mt-3 gap-2">
        {rows.map((row) => (
          <View key={row.label} className="flex-row items-center justify-between">
            <Text variant="caption" className="text-text-secondary">
              {row.label}
            </Text>
            <Text variant="label" className="text-text-primary">
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
