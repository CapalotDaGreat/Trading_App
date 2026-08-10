import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { DnaEvolutionPoint } from '../types/personal-intelligence.types';

interface DnaEvolutionTimelineProps {
  points: DnaEvolutionPoint[];
}

export function DnaEvolutionTimeline({ points }: DnaEvolutionTimelineProps) {
  if (!points.length) {
    return (
      <GlassCard className="p-4">
        <Text variant="body-sm" className="text-text-secondary">
          DNA evolution appears as your Decision Log accumulates monthly process patterns.
        </Text>
      </GlassCard>
    );
  }

  return (
    <View className="gap-3" testID="dna-evolution-timeline">
      <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
        DNA evolution
      </Text>
      {points.map((point, index) => (
        <Animated.View key={point.monthKey} entering={FadeInDown.springify().delay(index * 40)}>
          <View className="flex-row gap-3">
            <View className="items-center">
              <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              {index < points.length - 1 ? (
                <View className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 28 }} />
              ) : null}
            </View>
            <GlassCard className="mb-1 flex-1 p-3">
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-accent">
                {point.hasEvidence === false ? `${point.label} · gathering` : point.label}
              </Text>
              <Text variant="label" className="mt-1 text-text-primary">
                {point.styleLabel}
              </Text>
              <Text variant="caption" className="mt-1 leading-relaxed text-text-secondary">
                {point.summary}
              </Text>
              <Text variant="caption" className="mt-2 text-text-tertiary">
                {point.dominantTraits.join(' · ')}
              </Text>
            </GlassCard>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
