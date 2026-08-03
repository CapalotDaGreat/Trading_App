import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { CoachingReference } from '../types/personal-intelligence.types';

interface CoachingReferencesCardProps {
  references: CoachingReference[];
}

export function CoachingReferencesCard({ references }: CoachingReferencesCardProps) {
  const router = useRouter();

  return (
    <Animated.View entering={FadeInDown.springify()} testID="coaching-references-card">
      <GlassCard className="p-4">
        <Text variant="caption" className="mb-1 font-semibold uppercase tracking-wide text-text-tertiary">
          Mentor references
        </Text>
        <Text variant="h3" className="mb-3">
          Your personal OS surfaces
        </Text>
        <View className="gap-2">
          {references.map((ref) => (
            <Pressable
              key={ref.id}
              accessibilityRole="button"
              accessibilityLabel={ref.label}
              testID={`coaching-ref-${ref.id}`}
              onPress={() => router.push(ref.href as never)}
              className="rounded-xl bg-surface px-3 py-3"
            >
              <Text variant="label" className="text-accent">
                {ref.label}
              </Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {ref.reason}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
