import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { AiMemoryTimelineEvent } from '../types/personal-intelligence.types';

interface AiMemoryTimelineProps {
  events: AiMemoryTimelineEvent[];
}

export function AiMemoryTimeline({ events }: AiMemoryTimelineProps) {
  const router = useRouter();

  return (
    <View className="gap-3" testID="ai-memory-timeline">
      <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
        AI memory timeline
      </Text>
      <Text variant="body-sm" className="text-text-secondary">
        Your learning journey — patience, impulse control, replay, research quality.
      </Text>
      {events.map((event, index) => (
        <Animated.View key={event.id} entering={FadeInDown.springify().delay(index * 35)}>
          <Pressable
            disabled={!event.href}
            onPress={() => event.href && router.push(event.href as never)}
            accessibilityRole={event.href ? 'button' : 'text'}
          >
            <View className="flex-row gap-3">
              <View className="items-center">
                <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                {index < events.length - 1 ? (
                  <View className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 24 }} />
                ) : null}
              </View>
              <GlassCard className="mb-1 flex-1 p-3">
                <Text variant="caption" className="font-semibold uppercase tracking-wide text-accent">
                  {event.kind} · {new Date(event.at).toLocaleDateString()}
                </Text>
                <Text variant="label" className="mt-1 text-text-primary">
                  {event.title}
                </Text>
                <Text variant="caption" className="mt-1 leading-relaxed text-text-secondary">
                  {event.detail}
                </Text>
              </GlassCard>
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}
