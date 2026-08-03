import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import type {
  DecisionGraphPeriod,
  DecisionGraphSnapshot,
} from '../types/personal-intelligence.types';

interface DecisionGraphCardProps {
  graph: DecisionGraphSnapshot;
  period: DecisionGraphPeriod;
  onPeriodChange: (period: DecisionGraphPeriod) => void;
}

const PERIODS: DecisionGraphPeriod[] = ['weekly', 'monthly', 'yearly'];

export function DecisionGraphCard({ graph, period, onPeriodChange }: DecisionGraphCardProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.springify()} testID="decision-graph-card">
      <GlassCard className="p-4">
        <View className="mb-3 flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
              Decision Graph
            </Text>
            <Text variant="h3" className="mt-1">
              Process intensity · {graph.overallScore}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row gap-2">
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityState={{ selected: period === p }}
              testID={`decision-graph-period-${p}`}
              onPress={() => onPeriodChange(p)}
              className={cn(
                'min-h-9 flex-1 items-center justify-center rounded-xl px-2',
                period === p ? 'bg-accent' : 'bg-surface',
              )}
            >
              <Text
                variant="caption"
                className={cn(
                  'font-semibold capitalize',
                  period === p ? 'text-text-inverse' : 'text-text-secondary',
                )}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          {graph.metrics.map((metric, index) => (
            <Pressable
              key={metric.id}
              accessibilityRole="button"
              accessibilityLabel={`${metric.label} ${metric.score}`}
              onPress={() => router.push(metric.href as never)}
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text variant="caption" className="text-text-primary">
                  {metric.label}
                </Text>
                <Text variant="caption" className="text-text-secondary">
                  {metric.score}
                </Text>
              </View>
              <View className="h-10 flex-row items-end gap-0.5">
                {metric.points.map((point) => {
                  const height = Math.max(4, Math.round((point.value / 100) * 36));
                  return (
                    <View key={point.key} className="min-w-0 flex-1 items-center justify-end">
                      <Animated.View
                        entering={FadeInDown.delay(index * 12)}
                        className="w-full rounded-t-sm"
                        style={{
                          height,
                          backgroundColor: colors.accent.primary,
                          opacity: 0.35 + (point.value / 100) * 0.55,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" className="mt-4 leading-relaxed text-text-secondary">
          {graph.insight}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          GitHub cadence × Apple Health clarity — process only, never P&L.
        </Text>
      </GlassCard>
    </Animated.View>
  );
}
