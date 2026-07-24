import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import type { PassportTrendPoint } from '../types/passport.types';

interface PassportTrendStripProps {
  title: string;
  points: PassportTrendPoint[];
  metric: 'decisionQualityAvg' | 'researchValueAvg';
}

export function PassportTrendStrip({ title, points, metric }: PassportTrendStripProps) {
  const { colors } = useTheme();
  const values = points.map((p) => p[metric]).filter((n): n is number => n != null);
  const latest = values.length ? values[values.length - 1] : null;

  return (
    <View testID={`passport-trend-${metric}`}>
      <View className="mb-2 flex-row items-end justify-between">
        <Text variant="label" className="text-text-primary">
          {title}
        </Text>
        <Text variant="caption" className="text-text-secondary">
          {latest != null ? `Latest ${latest}` : 'Awaiting scored decisions'}
        </Text>
      </View>
      <View className="h-16 flex-row items-end gap-1">
        {points.map((point) => {
          const value = point[metric];
          const height = value == null ? 6 : Math.max(8, Math.round((value / 100) * 56));
          return (
            <View key={point.key} className="min-w-0 flex-1 items-center justify-end">
              <View
                className="w-full rounded-t-md"
                style={{
                  height,
                  backgroundColor:
                    value == null ? colors.border.strong : colors.accent.primary,
                  opacity: value == null ? 0.35 : 0.85,
                }}
              />
            </View>
          );
        })}
      </View>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Weekly averages from Decision Log scores — never P&L.
      </Text>
    </View>
  );
}
