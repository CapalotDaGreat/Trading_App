import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { MENTOR_SETUP_TOTAL_STEPS } from '../content/mentor-setup.questions';

export function MentorSetupProgress({ step }: { step: number }) {
  const clamped = Math.max(0, Math.min(MENTOR_SETUP_TOTAL_STEPS - 1, step));
  const progress = (clamped + 1) / MENTOR_SETUP_TOTAL_STEPS;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="caption" className="text-text-tertiary">
          Step {clamped + 1} of {MENTOR_SETUP_TOTAL_STEPS}
        </Text>
        <Text variant="caption" className="text-text-tertiary">
          Under 2 minutes
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface">
        <View
          className={cn('h-full rounded-full bg-accent')}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
    </View>
  );
}
