import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { ProgressPulse } from '@/shared/components/ui/ProgressPulse';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/utils/cn';
import { fadeInDown } from '@/shared/utils/motion';

import type { AdaptiveGoal } from '../types/personal-intelligence.types';

interface AdaptiveGoalsCardProps {
  goals: AdaptiveGoal[];
}

export function AdaptiveGoalsCard({ goals }: AdaptiveGoalsCardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  if (!goals.length) return null;

  return (
    <Animated.View entering={fadeInDown(reduceMotion)} testID="today-section-goals">
      <GlassCard className="p-4">
        <Text variant="caption" className="mb-1 font-semibold uppercase tracking-wide text-text-tertiary">
          Adaptive goals
        </Text>
        <Text variant="h3" className="mb-3">
          This week&apos;s process targets
        </Text>
        <View className="gap-3">
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              accessibilityRole="button"
              accessibilityLabel={goal.title}
              accessibilityHint={goal.detail}
              testID={`adaptive-goal-${goal.id}`}
              onPress={() => router.push(goal.href as never)}
              className="rounded-xl bg-surface px-3 py-3"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text variant="label" className="text-text-primary">
                    {goal.title}
                  </Text>
                  <Text variant="caption" className="mt-1 text-text-secondary">
                    {goal.detail}
                  </Text>
                </View>
                <Text
                  variant="caption"
                  className={cn(
                    'font-semibold capitalize',
                    goal.priority === 'high' ? 'text-accent' : 'text-text-tertiary',
                  )}
                >
                  {goal.priority}
                </Text>
              </View>
              <ProgressPulse
                className="mt-2"
                progress={goal.progress}
                target={goal.target}
                label="Progress"
                completeLabel="Goal met"
              />
            </Pressable>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
