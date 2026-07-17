import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LessonCard } from '@/features/academy/components/LessonCard';
import { useLearningPath } from '@/features/academy/hooks/useAcademy';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function AcademyPathScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { pathId } = useLocalSearchParams<{ pathId: string }>();
  const { path, lessons, completedCount, isLoading } = useLearningPath(pathId ?? '');

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  if (!path) {
    return (
      <Screen>
        <Header title="Path" onBack={() => router.back()} />
        <Text variant="body" className="mt-6">
          Path not found.
        </Text>
      </Screen>
    );
  }

  const progressPct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title={path.title}
        subtitle={path.track === 'decision' ? 'Decision coach path' : 'Trading school path'}
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <Text variant="body-sm">{path.description}</Text>

        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="label" className="text-text-tertiary">
            PATH PROGRESS
          </Text>
          <Text variant="h3" className="mt-1">
            {completedCount}/{lessons.length} complete
          </Text>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${progressPct}%` }}
            />
          </View>
        </View>

        <View>
          <Text variant="h3" className="mb-2">
            Lessons in order
          </Text>
          {lessons.map((lesson, index) => (
            <View key={lesson.id}>
              <Text variant="caption" className="mb-1 ml-1 text-text-tertiary">
                Step {index + 1}
              </Text>
              <LessonCard lesson={lesson} />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
