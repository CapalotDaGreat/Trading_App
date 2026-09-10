import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { TrainingRecommendation } from '../types/training-planner.types';

const TYPE_LABEL: Record<TrainingRecommendation['activityType'], string> = {
  lesson: 'Lesson',
  practice: 'Practice',
  replay: 'Replay',
  simulation: 'Simulation',
  journal: 'Journal',
  review: 'Review',
  event: 'Event study',
  exploration: 'Optional',
};

export function PlannerNextCard({
  recommendation,
  onOpen,
  onDefer,
  eyebrow = 'Train next',
  testID = 'planner-next-card',
}: {
  recommendation: TrainingRecommendation;
  onOpen?: (item: TrainingRecommendation) => void;
  onDefer?: (id: string, conceptId?: string) => void;
  eyebrow?: string;
  testID?: string;
}) {
  const router = useRouter();
  return (
    <Surface tone="accent" emphasis="outlined" testID={testID}>
      <Text variant="label" className="text-accent">
        {eyebrow}
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        {TYPE_LABEL[recommendation.activityType]}
        {recommendation.estimatedMinutes ? ` · ~${recommendation.estimatedMinutes} min` : ''}
        {recommendation.isRemediation ? ' · required practice' : ''}
        {recommendation.isRedemonstration ? ' · re-demonstration' : ''}
        {recommendation.isTransferPractice ? ' · new context' : ''}
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {recommendation.title}
      </Text>
      <Text variant="label" className="mt-2 text-accent">
        Why this
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {recommendation.reason}
      </Text>
      {recommendation.evidence[0] && !recommendation.concealConcept ? (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Evidence: {recommendation.evidence[0]}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button
          size="sm"
          onPress={() => {
            onOpen?.(recommendation);
            router.push(recommendation.href as never);
          }}
        >
          Start
        </Button>
        {recommendation.deferralEligible && onDefer ? (
          <Button
            size="sm"
            variant="outline"
            onPress={() => onDefer(recommendation.id, recommendation.conceptId)}
          >
            Defer
          </Button>
        ) : null}
      </View>
    </Surface>
  );
}
