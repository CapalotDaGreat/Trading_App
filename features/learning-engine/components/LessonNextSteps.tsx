import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { LessonNextChain } from '../types/learning-engine.types';

export function LessonNextSteps({ chain }: { chain: LessonNextChain }) {
  const router = useRouter();
  return (
    <Surface className="mt-4" testID="lesson-next-steps">
      <Text variant="label">What to practice next</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {chain.reminder} Reading “{chain.lessonTitle}” is exposure. Demonstration comes next.
      </Text>
      <View className="mt-3 gap-2">
        {chain.steps.map((step, index) => (
          <Button
            key={step.id}
            size="sm"
            variant={index === 0 ? 'primary' : 'outline'}
            onPress={() => router.push(step.href as never)}
          >
            {index + 1}. {step.title}
          </Button>
        ))}
      </View>
      <Button className="mt-3" size="sm" variant="ghost" onPress={() => router.push('/practice' as never)}>
        Choose a different exercise
      </Button>
    </Surface>
  );
}
