import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { FocusArea } from '../types/learning-engine.types';

export function FocusAreaList({ areas }: { areas: FocusArea[] }) {
  const router = useRouter();
  const lead = areas[0];

  return (
    <Surface testID="home-weak-area">
      <Text variant="label" className="text-text-tertiary">
        What should I work on?
      </Text>
      {lead ? (
        <>
          <Text variant="h3" headingLevel={3} className="mt-2">
            {lead.title}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {lead.explanation}
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Evidence: {lead.evidence[0]}
          </Text>
          <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push(lead.href as never)}>
            Open this practice
          </Button>
        </>
      ) : (
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Collect a few demonstrated checks — quiz, exercise, replay, or a journaled decision. Reading alone does not
          set a focus.
        </Text>
      )}
      {areas.slice(1, 3).map((area) => (
        <View key={area.conceptId} className="mt-3">
          <Text variant="caption" className="text-text-tertiary">
            {area.title}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            {area.explanation}
          </Text>
        </View>
      ))}
    </Surface>
  );
}
