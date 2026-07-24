import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { PassportTimelineEvent } from '../types/passport.types';

const KIND_LABEL: Record<PassportTimelineEvent['kind'], string> = {
  habit: 'Habit',
  quality: 'Decision quality',
  learning: 'Learning',
  achievement: 'Achievement',
  identity: 'Identity',
};

interface PassportTimelineProps {
  events: PassportTimelineEvent[];
}

export function PassportTimeline({ events }: PassportTimelineProps) {
  if (events.length === 0) {
    return (
      <GlassCard className="p-4">
        <Text variant="body-sm" className="text-text-secondary">
          Your evolution timeline fills as you journal, replay, learn, and practice.
        </Text>
      </GlassCard>
    );
  }

  return (
    <View className="gap-3" testID="passport-timeline">
      {events.map((event, index) => (
        <Animated.View key={event.id} entering={FadeInDown.springify().delay(index * 35)}>
          <View className="flex-row gap-3">
            <View className="items-center">
              <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              {index < events.length - 1 ? (
                <View className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 28 }} />
              ) : null}
            </View>
            <GlassCard className="mb-1 flex-1 p-3">
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-accent">
                {KIND_LABEL[event.kind]} · {new Date(event.at).toLocaleDateString()}
              </Text>
              <Text variant="label" className="mt-1 text-text-primary">
                {event.title}
              </Text>
              <Text variant="caption" className="mt-1 leading-relaxed text-text-secondary">
                {event.detail}
              </Text>
            </GlassCard>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
