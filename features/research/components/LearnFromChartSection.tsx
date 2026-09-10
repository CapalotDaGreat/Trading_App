import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { getLocalLessonById } from '@/features/academy/content';
import { Text } from '@/shared/components/ui/Text';

import { STUDY_CONCEPTS, type StudyConcept } from '../services/asset-study.service';

interface LearnFromChartSectionProps {
  symbol: string;
  onSelectConcept?: (concept: StudyConcept) => void;
}

export function LearnFromChartSection({ symbol, onSelectConcept }: LearnFromChartSectionProps) {
  const router = useRouter();

  return (
    <View testID="asset-learn-from-chart">
      <Text variant="label" className="text-text-tertiary">
        Learn from this chart
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-1">
        What can {symbol.toUpperCase()} teach?
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Open a short Academy lesson. The chart is a specimen — not a reason to trade.
      </Text>
      <View className="mt-3 gap-2">
        {STUDY_CONCEPTS.map((concept) => {
          const lesson = getLocalLessonById(concept.lessonId);
          return (
            <Pressable
              key={concept.id}
              accessibilityRole="button"
              accessibilityLabel={`Learn ${concept.title} with ${symbol}`}
              testID={`asset-concept-${concept.id}`}
              onPress={() => {
                onSelectConcept?.(concept);
                router.push(`/academy/lesson/${concept.lessonId}` as never);
              }}
              className="min-h-11 rounded-2xl bg-surface px-3 py-3"
            >
              <Text variant="label">{concept.title}</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {concept.question}
              </Text>
              {lesson ? (
                <Text variant="caption" className="mt-1 text-accent">
                  Lesson · {lesson.title}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
