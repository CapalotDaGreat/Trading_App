import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { EventTrainingPlan } from '../types/events.types';

export function EventTrainingPlanCard({ plan }: { plan: EventTrainingPlan }) {
  const router = useRouter();
  return (
    <Surface tone="accent" emphasis="outlined" className="mb-4" testID="event-training-plan">
      <Text variant="label" className="text-accent">
        Training relevant to upcoming events
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {plan.headline}
      </Text>
      {plan.practiceGapNote ? (
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {plan.practiceGapNote}
        </Text>
      ) : null}
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Recommended study — not a trade alert, and not a prediction of this event.
      </Text>
      <View className="mt-3 gap-2">
        <Button size="sm" onPress={() => router.push(plan.lessonHref as never)}>
          Lesson: {plan.lessonTitle}
        </Button>
        <Button size="sm" variant="outline" onPress={() => router.push(plan.practiceHref as never)}>
          Practice: {plan.practiceTitle}
        </Button>
        <Button size="sm" variant="outline" onPress={() => router.push(plan.replayHref as never)}>
          Replay: {plan.replayTitle}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => router.push(plan.simulateHref as never)}>
          Simulation: {plan.simulateTitle}
        </Button>
      </View>
      <Text variant="caption" className="mt-3 text-text-tertiary">
        {plan.reminder}
      </Text>
    </Surface>
  );
}
