import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { TodaysTraining, TrainingQueueItem } from '../types/learning-engine.types';

const KIND_LABEL: Record<TrainingQueueItem['kind'], string> = {
  continue_lesson: 'Continue lesson',
  review_concept: 'Review concept',
  chart_exercise: 'Chart exercise',
  historical_replay: 'Historical replay',
  simulation_challenge: 'Simulation challenge',
  journal_review: 'Journal review',
  spaced_review: 'Spaced practice',
  event_prep: 'Event prep',
};

export function TodaysTrainingCard({
  plan,
  onSkip,
  onDefer,
  onBookmark,
  isBookmarked,
}: {
  plan: TodaysTraining;
  onSkip: (id: string) => void;
  onDefer: (id: string) => void;
  onBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}) {
  const router = useRouter();
  const lead = plan.items[0];

  return (
    <Surface tone="accent" emphasis="outlined" testID="home-todays-training">
      <Text variant="label" className="text-accent">
        Today&apos;s Training
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {plan.headline}
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {plan.coachLine}
      </Text>

      {lead ? (
        <View className="mt-3" testID="home-suggested-next">
          <Text variant="caption" className="text-text-tertiary">
            {KIND_LABEL[lead.kind]} · start here
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {lead.reason}
          </Text>
          {lead.evidence[0] ? (
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Evidence: {lead.evidence[0]}
            </Text>
          ) : null}
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => router.push(lead.href as never)}>
              Practice this
            </Button>
            <Button size="sm" variant="outline" onPress={() => onDefer(lead.id)}>
              Defer
            </Button>
            <Button size="sm" variant="ghost" onPress={() => onSkip(lead.id)}>
              Skip
            </Button>
            <Button size="sm" variant="ghost" onPress={() => onBookmark(lead.id)}>
              {isBookmarked(lead.id) ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </View>
        </View>
      ) : null}

      {plan.items.slice(1).map((item) => (
        <View key={item.id} className="mt-4 border-t border-border pt-3">
          <Text variant="caption" className="text-text-tertiary">
            {KIND_LABEL[item.kind]}
          </Text>
          <Text variant="body-sm" className="mt-1">
            {item.title}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            {item.reason}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Button size="sm" variant="outline" onPress={() => router.push(item.href as never)}>
              Open
            </Button>
            <Button size="sm" variant="ghost" onPress={() => onDefer(item.id)}>
              Later
            </Button>
            <Button size="sm" variant="ghost" onPress={() => onSkip(item.id)}>
              Skip
            </Button>
          </View>
        </View>
      ))}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button size="sm" variant="ghost" onPress={() => router.push('/learn' as never)}>
          Choose another topic
        </Button>
        <Button size="sm" variant="ghost" onPress={() => router.push('/practice' as never)}>
          Browse exercises
        </Button>
      </View>
    </Surface>
  );
}
