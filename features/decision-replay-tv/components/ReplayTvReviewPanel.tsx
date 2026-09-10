import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { ReplayLabReview } from '@/features/decision-replay-tv/services/replay-tv-review.service';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvReviewPanel({ review }: { review: ReplayLabReview }) {
  const router = useRouter();

  return (
    <View className="gap-3" testID="replay-tv-lab-review">
      <Text variant="caption" className="text-text-tertiary">
        {review.reminder}
      </Text>
      <Surface emphasis="outlined" testID="replay-knew-then">
        <Text variant="label">What you knew then</Text>
        <Text variant="body-sm" className="mt-1 text-text-secondary">
          {review.knewThen}
        </Text>
      </Surface>
      <Surface emphasis="outlined" testID="replay-happened-after">
        <Text variant="label">What happened afterward</Text>
        <Text variant="body-sm" className="mt-1 text-text-secondary">
          {review.happenedAfter}
        </Text>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          {review.outcomeNote}
        </Text>
      </Surface>
      {review.dimensions.map((item) => (
        <Surface key={item.id} emphasis="outlined">
          <Text variant="label">
            {item.label}
            {item.score != null ? ` · ${item.score}` : ''}
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {item.note}
          </Text>
        </Surface>
      ))}
      <Text variant="label">Counterfactuals</Text>
      {review.counterfactuals.map((item) => (
        <View key={item.id} className="rounded-xl bg-background px-3 py-2">
          <Text variant="body-sm">{item.prompt}</Text>
          <Text variant="caption" className="mt-1 text-text-tertiary">
            {item.note}
          </Text>
        </View>
      ))}
      <Text variant="label">Keep the loop moving</Text>
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" onPress={() => router.push(review.loop.lessonHref as never)}>
          {review.loop.lessonLabel}
        </Button>
        <Button size="sm" variant="outline" onPress={() => router.push(review.loop.practiceHref as never)}>
          {review.loop.practiceLabel}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => router.push(review.loop.simulateHref as never)}>
          {review.loop.simulateLabel}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => router.push(review.loop.reviewHref as never)}>
          {review.loop.reviewLabel}
        </Button>
      </View>
    </View>
  );
}
