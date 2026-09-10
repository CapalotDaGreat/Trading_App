import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { DevelopmentHistoryView } from '../types/learner-model.types';

export function DevelopmentHistoryCard({
  history,
}: {
  history: DevelopmentHistoryView | null;
}) {
  const router = useRouter();
  if (!history) return null;

  return (
    <Surface testID="development-history" accessibilityLabel="Development history">
      <Text variant="label" className="text-text-tertiary">
        Development
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {history.title}
      </Text>
      <View className="mt-3 gap-3">
        <View>
          <Text variant="label" className="text-text-tertiary">
            Earlier
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {history.earlier}
          </Text>
        </View>
        <View>
          <Text variant="label" className="text-text-tertiary">
            Recently
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {history.recently}
          </Text>
        </View>
        <View>
          <Text variant="label" className="text-text-tertiary">
            Next
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {history.next}
          </Text>
        </View>
      </View>
      {history.href ? (
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onPress={() => router.push(history.href as never)}
          accessibilityLabel={`Continue development: ${history.title}`}
        >
          Continue this practice
        </Button>
      ) : null}
    </Surface>
  );
}
